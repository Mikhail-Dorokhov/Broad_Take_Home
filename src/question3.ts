import { start } from "repl";
import { arrayBuffer } from "stream/consumers";
import { validateLocaleAndSetLanguage } from "typescript";
import { MbtaApiIntegration } from "./datasources/MBTA/datasource";
import { RouteData, RouteType } from "./datasources/MBTA/models";

function findConnectingStation(
  startRoute: string,
  endRoute: string,
  connectionsMap: Map<string, string[]>
): string | null {
  for (const stop of connectionsMap.keys()) {
    const routes = connectionsMap.get(stop);
    if (routes?.includes(startRoute) && routes?.includes(endRoute)) {
      return stop;
    }
  }
  return null;
}

function buildRouteList(
  startRoute: string[],
  endRoute: string[],
  connectionsMap: Map<string, string[]>
): string {
  let startRouteConnections: string[] = [];
  let endRouteConnections: string[] = [];

  connectionsMap.forEach((routes, stop) => {
    if (startRoute.some((route) => routes.includes(route))) {
      startRouteConnections = startRouteConnections.concat(routes);
    }
    if (routes.some((route) => endRoute.includes(route))) {
      endRouteConnections = endRouteConnections.concat(routes);
    }
  });

  startRouteConnections = startRouteConnections
    .filter((val, index) => startRouteConnections.indexOf(val) === index)
    .filter((route) => !startRoute.includes(route));

  endRouteConnections = endRouteConnections
    .filter((val, index) => endRouteConnections.indexOf(val) === index)
    .filter((route) => !endRoute.includes(route));

  const commonConnections = startRouteConnections.filter((route) =>
    endRouteConnections.includes(route)
  );
  // No direct connection between the 2 routes so we have to check if they have mutual connections
  switch (commonConnections.length) {
    case 0:
      throw new Error(
        "Either no route exists or route requires more than 1 connection"
      );
    case 1:
      return `${startRoute[0]}, ${commonConnections[0]}, ${endRoute[0]}`;
    default:
      return `${startRoute}, [${commonConnections.join(" OR ")}], ${endRoute}`;
  }
}

/** This function takes in 2 stops and returns the route(s) that one would use to traverse betweeen them
 *
 * Current limitations:
 *      If there are muliple direct connection between stops, will not return all of the connections
 *          Ex: overlapping Green line stops
 *      Does not support finding multiple connecting lines(This case does not exist for Light or Heavy rail)
 *
 * Future enhancment ideas:
 *   Find the shortest connection between the 2 lines(# of stops)
 *   Return a list of stops that will get you from the source to the dest
 * */
async function getRoutesString(
  startStop: string,
  endStop: string
): Promise<string> {
  const api = new MbtaApiIntegration();

  let startRoutes: string[] = [];
  let endRoutes: string[] = [];

  const stopsMap = await api.buildStopsToRoutesMap([
    RouteType.LIGHT_RAIL,
    RouteType.HEAVY_RAIL,
  ]);
  const connectionsMap = await api.buildConnectionsMap(stopsMap);

  // Since a stop can have multiple routes, we build a list of all possible starting
  // and ending routes
  stopsMap.forEach((stops, route) => {
    if (stops.includes(startStop)) {
      startRoutes.push(route);
    }
    if (stops.includes(endStop)) {
      endRoutes.push(route);
    }
  });

  if (
    startRoutes.length === 1 &&
    endRoutes.length === 1 &&
    startRoutes[0] === endRoutes[0]
  ) {
    // Both stops are on the same route
    return startRoutes[0];
  } else if (startRoutes.length === 1 && endRoutes.length > 1) {
    if (endRoutes.includes(startRoutes[0])) {
      // The 2 stops directly connect to each other(Ex: Red to Orange)
      return startRoutes[0];
    }
  } else if (startRoutes.length > 1 && endRoutes.length === 1) {
    if (startRoutes.includes(endRoutes[0])) {
      // The 2 stops directly connect to each other(Ex: Red to Orange)
      return endRoutes[0];
    }
  } else {
    //Both stops have multiple routes that serve them.
    // First we will check if both stops share a route
    const commonRoutes = startRoutes.filter((route) =>
      endRoutes.includes(route)
    );
    if (commonRoutes.length > 0) {
      return commonRoutes[0];
    }

    // There is no Route that serves both stations so we have to find routes
    // if there is a connection between the Routes that serve the starting station
    // and the Routes that serve the ending station
    let directConnection = false;
    for (const start of startRoutes) {
      for (const end of endRoutes) {
        const connectingStation = findConnectingStation(
          start,
          end,
          connectionsMap
        );
        if (connectingStation) {
          directConnection = true;
        }
      }
    }
    if (directConnection) {
      return `[${startRoutes.join(" OR ")}], [${endRoutes.join(" OR ")}]`;
    }
  }

  return buildRouteList(startRoutes, endRoutes, connectionsMap);
}

async function main() {
  const args = process.argv.slice(2);

  //Get the stops the user passed in on the command line
  if (args.length !== 2) {
    throw Error(
      "You must pass in 2 stop names, each in quotes, and seperated by a space"
    );
  }
  const [startStop, endStop] = args;

  const linesString = await getRoutesString(startStop, endStop);
  console.log(`${startStop} to ${endStop} -> ${linesString}`);
}

main();

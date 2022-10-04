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

async function q3(startStop: string, endStop: string): Promise<string> {
  const api = new MbtaApiIntegration();

  let startRoute: string[] = [];
  let endRoute: string[] = [];

  const stopsMap = await api.buildStopsToRoutesMap([
    RouteType.LIGHT_RAIL,
    RouteType.HEAVY_RAIL,
  ]);
  const connectionsMap = await api.buildConnectionsMap(stopsMap);
  //find out which routes the given stops are on

  stopsMap.forEach((stops, route) => {
    if (stops.includes(startStop)) {
      startRoute.push(route);
    }
    if (stops.includes(endStop)) {
      endRoute.push(route);
    }
  });

  // Both stops are on the same route
  if (
    startRoute.length === 1 &&
    endRoute.length === 1 &&
    startRoute[0] === endRoute[0]
  ) {
    return startRoute[0];
  } else if (startRoute.length === 1 && endRoute.length > 1) {
    if (endRoute.includes(startRoute[0])) {
      return startRoute[0];
    }
  } else if (startRoute.length > 1 && endRoute.length === 1) {
    if (startRoute.includes(endRoute[0])) {
      return endRoute[0];
    }
  } else {
    //Both stops have multiple routes that serve them.
    // First we will check if both stops share a route
    const commonRoutes = startRoute.filter((route) => endRoute.includes(route));
    if (commonRoutes.length > 0) {
      return commonRoutes[0];
    }
    // If they don't we'll have to check for connections between lines

    let directConnection = false;
    for (const start of startRoute) {
      for (const end of endRoute) {
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
      return `${startRoute}, ${endRoute}`;
    }
  }

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

  // How to model connections between routes?
  //      List of routes to connecting stop?
  //      Ex: [Red, Orange]: Downtown Crossing
  //    Or is existing map of Stop: Routes[] fine?
  // Both will contain the same information but in a different order so either should work
  // But we already have a function to build the Map of Stop: Routes[] so we'll go with that

  // What happens if lines are not directly connected?
  // Ex: Blue to Red
  //  Find lines that they are connected to and check for connenctions between those lines
  // Future enhancements: Find the shortest connection between the 2 lines

  // Return a list of stops that will get you from the source to the dest
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

  const linesString = await q3(startStop, endStop);
  console.log(`${startStop} to ${endStop} -> ${linesString}`);
}

main();

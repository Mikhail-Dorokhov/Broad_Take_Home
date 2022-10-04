import { MbtaApiIntegration } from "./datasources/MBTA/datasource";
import { RouteData, RouteType } from "./datasources/MBTA/models";

// Type to represent a pairing of a Route name and it's length
type routeToStopCount = { route: string; numStops: number };

function findShortestAndLongestRoutes(routesMap: Map<string, string[]>): {
  shortest: routeToStopCount;
  longest: routeToStopCount;
} {
  const longestRouteAndCount: routeToStopCount = {
    route: "",
    numStops: Number.MIN_SAFE_INTEGER,
  };

  const shortestRouteAndCount: routeToStopCount = {
    route: "",
    numStops: Number.MAX_SAFE_INTEGER,
  };

  for (const route of routesMap.keys()) {
    const routeLength = routesMap.get(route)?.length;
    if (!routeLength) {
      throw new Error(`List of stops does not exist for Route: ${route}`);
    }
    if (routeLength > longestRouteAndCount.numStops) {
      longestRouteAndCount.route = route;
      longestRouteAndCount.numStops = routeLength;
    }
    if (routeLength < shortestRouteAndCount.numStops) {
      shortestRouteAndCount.route = route;
      shortestRouteAndCount.numStops = routeLength;
    }
  }

  return {
    shortest: shortestRouteAndCount,
    longest: longestRouteAndCount,
  };
}

async function main() {
  const api = new MbtaApiIntegration();

  const routeToStopNamesMap = await api.buildStopsToRoutesMap([
    RouteType.LIGHT_RAIL,
    RouteType.HEAVY_RAIL,
  ]);

  const { shortest: shortestRouteAndCount, longest: longestRouteAndCount } =
    findShortestAndLongestRoutes(routeToStopNamesMap);

  //Return the Route with the least number of stops
  console.log(longestRouteAndCount);
  //Return the Route with the most number of stops
  console.log(shortestRouteAndCount);

  //Return a list of stops that connect 2 or more Routes + those Routes names
  const connections = api.buildConnectionsMap(routeToStopNamesMap);
  connections.forEach((routes, stop) => {
    console.log(`${stop} connects the following lines: ${routes}`);
  });
}

main();

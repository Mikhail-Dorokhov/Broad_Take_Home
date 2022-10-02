import { MbtaApiIntegration } from "./datasources/MBTA/datasource";
import { RouteData, RouteType } from "./datasources/MBTA/models";

function findConnectingStations(routeToStopsMap: Map<string, string[]>) {
    const stopToRoutesMap = new Map<string,string[]>();
    //Take the current map of Route to Stops and flip it to be a map of 
    // Stop to Routes. This works since connecting stops have the same name 
    //in each Route's list of stops.
    for (const route of routeToStopsMap.keys()) {
        const stops = routeToStopsMap.get(route);
        for (const stop of stops?? []) {
            const routes = stopToRoutesMap.get(stop);

            if (!routes) {
                // We have to create a new entry for the list of Routes that service this stop
                stopToRoutesMap.set(stop, [route]);
            }
            else {
                // We have to add a Route to the list of Routes that service this stop
                stopToRoutesMap.set(stop, [...routes, route]);
            }
        }
    }

    //Now that we have the map we have to find the entries with values set to a length > 1
    stopToRoutesMap.forEach((routes, stop) => {
        if (routes.length > 1) {
            console.log(`${stop} connects the following lines: ${routes}`);
        }
    });


}
async function main() {
    const api = new MbtaApiIntegration();
    const response = await api.getRoutesByType([RouteType.LIGHT_RAIL, RouteType.HEAVY_RAIL]);

    const routeIds: string[] = response.map((route: RouteData) => route.id );

    const routeToStopNamesMap = new Map<string, string[]>();

    for (const routeId of routeIds) {
        const stops = await api.getStopsByRouteIds(routeId);
        routeToStopNamesMap.set(routeId, stops.map((stop: { attributes: { name: any; }; }) => stop.attributes.name))
    }

    type routeToStopCount = { route: string, numStops: number };

    const longestRouteAndCount: routeToStopCount = 
        {route: "", numStops: Number.MIN_SAFE_INTEGER};
    
    const shortestRouteAndCount: routeToStopCount = 
        {route: "", numStops: Number.MAX_SAFE_INTEGER};

    for (const route of routeToStopNamesMap.keys()) {
        const routeLength = routeToStopNamesMap.get(route)?.length
        if (!routeLength) {
            throw new Error(`List of stops does not exist for Route: ${route}`);
        }
        if (routeLength > longestRouteAndCount.numStops) {
            longestRouteAndCount.route = route
            longestRouteAndCount.numStops = routeLength
        }
        if (routeLength < shortestRouteAndCount.numStops) {
            shortestRouteAndCount.route = route
            shortestRouteAndCount.numStops = routeLength
        }
    }

    //Return the Route with the least number of stops 
    console.log(longestRouteAndCount);
    //Return the Route with the most number of stops
    console.log(shortestRouteAndCount);
    //Return a list of stops that connect 2 or more Routes + those Routes names
    findConnectingStations(routeToStopNamesMap);
}

main()
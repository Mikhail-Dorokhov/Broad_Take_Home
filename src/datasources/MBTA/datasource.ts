import axios from "axios";
import { RouteData, RouteType } from "./models";

export class MbtaApiIntegration {
  private baseUrl = "https://api-v3.mbta.com";

  // Returns the Routes of the given types.
  async getRoutesByType(routeTypes: RouteType[]) {
    const routes = await axios({
      method: "get",
      url: `${
        this.baseUrl
      }/routes?fields[]=long_name,id&filter[type]=${routeTypes.join(",")}`,
    });
    return routes.data.data;
  }

  // Gets the stops for each given Route
  async getStopsByRouteIds(id: string) {
    const line = await axios({
      method: "get",
      baseURL: this.baseUrl,
      url: `/stops?route=${id}`,
    });
    return line.data.data;
  }

  // This function creates a map of Route Names to the stops along that route
  // for the given RouteTypes
  async buildStopsToRoutesMap(routeTypes: RouteType[]) {
    const response = await this.getRoutesByType(routeTypes);

    const routeIds: string[] = response.map((route: RouteData) => route.id);

    const routeToStopNamesMap = new Map<string, string[]>();

    for (const routeId of routeIds) {
      const stops = await this.getStopsByRouteIds(routeId);
      routeToStopNamesMap.set(
        routeId,
        stops.map((stop: { attributes: { name: any } }) => stop.attributes.name)
      );
    }

    return routeToStopNamesMap;
  }

  buildConnectionsMap(routeToStopsMap: Map<string, string[]>) {
    const stopToRoutesMap = new Map<string, string[]>();
    //Take the current map of Route to Stops and flip it to be a map of
    // Stop to Routes. This works since connecting stops have the same name
    //in each Route's list of stops.
    for (const route of routeToStopsMap.keys()) {
      const stops = routeToStopsMap.get(route);
      for (const stop of stops ?? []) {
        const routes = stopToRoutesMap.get(stop);
        if (!routes) {
          // We have to create a new entry for the list of Routes that service this stop
          stopToRoutesMap.set(stop, [route]);
        } else {
          // We have to add a Route to the list of Routes that service this stop
          stopToRoutesMap.set(stop, [...routes, route]);
        }
      }
    }

    //Now that we have the map we have to find the entries with values set to a length > 1
    stopToRoutesMap.forEach((routes, stop) => {
      // If there is only one route for the stop it isn't a
      // connecting station so we delete it from the map
      if (routes.length <= 1) {
        stopToRoutesMap.delete(stop);
      }
    });
    return stopToRoutesMap;
  }
}

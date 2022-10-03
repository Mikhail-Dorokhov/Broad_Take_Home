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
}

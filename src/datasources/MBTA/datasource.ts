import axios from "axios";
import { RouteData, RouteType } from "./models";


export class MbtaApiIntegration {
    private baseUrl = "https://api-v3.mbta.com";

    // Returns the Routes of the given types.
    async getRoutesByType(routeTypes: RouteType[])  {
        const routes = await axios({
            method: "get",
            url: `${this.baseUrl}/routes?fields[]=long_name,id&filter[type]=${routeTypes.join(',')}`
        });
        return routes.data.data;
    }


    // Gets the stops for each given Route
    async getStopsByRouteIds(id: string) {
        const line = await axios({
            method: "get",
            baseURL: this.baseUrl,
            url: `/stops?route=${id}` 
        });
        return line;
    }
}
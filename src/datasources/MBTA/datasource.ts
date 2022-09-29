import axios from "axios";
import { RouteData, RouteType } from "./models";


export class MbtaApiIntegration {
    private baseUrl = "https://api-v3.mbta.com";

    async getRoutesByType(routeTypes: RouteType[]) : Promise<string[]>  {
        const routes = await axios({
            method: "get",
            url: `${this.baseUrl}/routes?filter[type]=${routeTypes.join(',')}`
        });
        
        return routes.data.data.map((route: RouteData) => 
        {
            return route.attributes?.long_name;  
        })
    }
}
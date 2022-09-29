import { MbtaApiIntegration } from "./datasources/MBTA/datasource";
import { RouteData, RouteType } from "./datasources/MBTA/models";

async function main() {
    const api = new MbtaApiIntegration();
    const response = await api.getRoutesByType([RouteType.LIGHT_RAIL, RouteType.HEAVY_RAIL]);

    const longNames = response.map((route: RouteData) => 
    {
        return route.attributes?.long_name 
    })
    console.log(longNames);
}

main()
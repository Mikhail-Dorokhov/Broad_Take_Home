import { MbtaApiIntegration } from "./datasources/MBTA/datasource";
import { RouteType } from "./datasources/MBTA/models";

async function main() {
    const api = new MbtaApiIntegration();
    const response = await api.getRoutesByType([RouteType.LIGHT_RAIL, RouteType.HEAVY_RAIL]);
    console.log(response);
}

main()
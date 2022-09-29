export enum RouteType {
    LIGHT_RAIL = 0,
    HEAVY_RAIL = 1
}
export type RouteData = {
    id: string,
    attributes: {
        short_name: string,
        long_name: string,
    }
}
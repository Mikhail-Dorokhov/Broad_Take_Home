/**
 * This file contains type definitions for data that the MBTA api returns.
 * The primary goal of these definitions is to improve developer experience
 * by giving TS enough context to be able to provide autocomplete suggestions.
 *
 * It is important to note that since TS enforces type compatability
 * and not type equality these types are NOT complete.
 * Please consult the MBTA api for the entire sturcture of these objects
 */
export enum RouteType {
  LIGHT_RAIL = 0,
  HEAVY_RAIL = 1,
}
export type RouteData = {
  id: string;
  attributes: {
    short_name: string;
    long_name: string;
  };
};

export type StopData = {
  attributes: { name: string };
};

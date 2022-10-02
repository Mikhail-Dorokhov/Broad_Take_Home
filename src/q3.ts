import { MbtaApiIntegration } from "./datasources/MBTA/datasource";
import { RouteData, RouteType } from "./datasources/MBTA/models";

async function main() {
    const api = new MbtaApiIntegration();

    //ask for first stop

    //ask for second stop

    //find out which routes the given stops are on

    // How to model connections between routes?
    //      List of routes to connecting stop?
    //      Ex: [Red, Orange]: Downtown Crossing   

    // What happens if lines are not directly connected?
    // Ex: Blue to Red
    //  Find lines that they are connected to and check for conenctions between those lines
    // Future enhancements: Find the shortest connection between the 2 lines

    // What happens if lines have sections that overlap?
    // Ex: all of the green lines

    // Return a list of stops that will get you from the source to the dest

}

main()
import Papa from "papaparse";
function parseCSVElectionData(electionData) {
    let toReturn = {};
    const parsedCSV = Papa.parse(electionData);
    parsedCSV.data.forEach(cols => {
        const election = cols[0];
        const canidate = cols[1];
        const pct = cols[3];
        const amount = cols[4];

        if(toReturn[election] === undefined)
            toReturn[election] = {};
        if(toReturn[election][pct] === undefined)
            toReturn[election][pct] = {};
        toReturn[election][pct][canidate] = parseInt(amount);

    });

    return toReturn;
}

export default parseCSVElectionData;
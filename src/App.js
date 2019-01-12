import React, { Component } from 'react';
import './App.css';

import RightSidePanel from "./Containers/RightSidePanel";
import MainScreenWrapper from "./Containers/MainScreenWrapper";
import LeafletMap from "./Components/LeafletMapv2";
import { setTimeout } from 'timers';
import ElectionSelect from './Components/ElectionSelect';
import parseCSVElectionData from "./Utils/ElectionDataParser";
import RaceSelect from './Components/RaceSelect';
import ElectionDetailWindow from './Components/ElectionDetailWindow';
import MapConfigSelect from './Components/MapConfigSelect';
import { resolve } from 'url';
import election1 from '../public/elections/20141104_FranklinPrecincts.csv';
import election2 from '../public/elections/20161108_FranklinPrecincts.csv';
import election3 from '../public/elections/20170801_FranklinPrecincts.csv';
import election4 from '../public/elections/20171107_FranklinPrecincts.csv';
import election5 from "../public/elections/20180807_FranklinPrecincts.csv";
import election6 from "../public/elections/20181106_FranklinPrecincts.csv";

var votingPrct;

import('../public/geojson/voting_prct.json').then(data => {
  votingPrct = data;
});


class App extends Component {
  
  /*
  TODO Get the latest election from website (Nov 7 2017)
    TODO table? (how would this look with multipel canidates? big table)
    TODO if you are on a election, and race, then click election box, but dont change it
        dont reset the election
    TODO show winner of county race results in side bar (not just the selected precint)
      HERE: ElectionDetailWindow:167
    TODO find most ballots in a precint and show % voted for a particular race
        That way you can see if people voted in an election but didn't vote for a particular race
    TODO see leaflet mapv2:155
  
  */

  constructor(props) {
    super(props);
    let self = this;

    this.state = {
      electionSelected: undefined,
      allPossibleElections: undefined,
      raceSelected: undefined,
      geoJsonData: undefined,
      mapSettings: [
        {
          label: "Over all percent of vote", 
          value:{
            calculateResult : function(featureValue) {
              //featureValue is an obj {name: #, etc.}
              const totalVotesHere = Object.values(featureValue).reduce((a,b) => a + b, 0);
              let winner = ["",0];
              Object.entries(featureValue)
                .forEach(entry => {
                  if(entry[1] > winner[1])
                    winner = entry;
                });
              const winName = winner[0];
              const winAmount = winner[1];
              winner = {
                name: winName,
                amount: winAmount / totalVotesHere * 100
              };
              
              if(winName === [self.state.canidate1, self.state.canidate2].sort()[0])
                winner.amount *= -1;
              
              return winner;
            },
            axisValues: [-100,-80,-75,-50,0,50,75,80,100]
          }
        },
        /*{
          label: "Winning percent", 
          value: {
            calculateResult : function(featureValue) {
              let entries = Object.entries(featureValue)
                .map(a => ({key: a[0], value: a[1]}));

              let winningAmount = 0, winningIndex = -1;
              entries.forEach((d,i) => {
                if(d.value > winningAmount) {
                  winningAmount = d.value;
                  winningIndex = i;
                }
              });

              const othersAmount = entries
                .filter((a,i) => i != winningIndex)
                .reduce((a,b) => a + b.value, 0);
              
              return {
                  name: (entries[winningIndex] && entries[winningIndex].key),
                  amount: winningAmount / othersAmount * 100
                };
            },
            axisValues: [0,10,20,50,100,200,300,750,1300]
          }
        },*/
        {
          label: "Percent of total votes cast",
          value: {
            calculateResult : function(results) {

              const votesInThisPrecint = Object.values(results).reduce((a,b) => a + b,0);
              return {name:undefined, amount:((votesInThisPrecint / self.state.totalVotesInThisElection)*100).toFixed(3)};  
            },
            axisValues: [0.05,0.1,0.3,0.5,0.7,1.0,1.5,3.0,5.0],
            colorPallet: ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#005a32']
          }
        }
      ]
    };

    this.state.selectedMapSetting = this.state.mapSettings[0];
    this.getGeoJson();
    this.getElections();
  }

  electionDataChanged(selectedOption) {
    const self = this;
    this.setState({ electionSelected: selectedOption });
    this.downloadElectionData(selectedOption)
    .then(function() {
      self.setState({
        allPossibleRaces:Object.keys(self.state.selectedElectionData)
        .map(d => ({value: d, label: d})),
          raceSelected : undefined
      })
    })
  }

  raceSelectionChanged(selectedOption) {
    const precintData = this.getPrecintData(undefined, selectedOption);

    const totalVotes = Object.entries(precintData)
      .filter(d => d[0] > -1)
      .reduce((a,b) => {
        return a + Object.values(b[1]).reduce((a,b) => a + b, 0);
      },0);
      //Find who has how many votes for the entire area
    let canidateCounters = {};
    Object.entries(precintData)
      .filter(d => d[0] != -1)
      .forEach((d) => {
        //d here is a precint
        Object.entries(d[1])
          .forEach(entry => {
            if(!canidateCounters[entry[0]])
              canidateCounters[entry[0]] = 0;
            canidateCounters[entry[0]] += entry[1];
          });
      });
      const sortedCanidates = Object.entries(canidateCounters).sort((a,b) => b[1] - a[1]);

    this.setState({ 
      raceSelected: selectedOption,
      totalVotesInThisElection: totalVotes,
      canidate1: sortedCanidates[0][0],
      canidate2: sortedCanidates[1] && sortedCanidates[1][0]
    });   

  }
  mapSettingChanges(selectedOption) {
    this.setState({ selectedMapSetting: selectedOption });
  }

  getPrecintData(selectedElection, selectedRace) {
    selectedElection = selectedElection || this.state.selectedElectionData;
    selectedRace = selectedRace || this.state.raceSelected;
    if(selectedElection && selectedRace)
      return selectedElection[selectedRace.value];
    return {}
  }

  getResult(results) {
    return this.state.selectedMapSetting.value.calculateResult(results);
  }


  render() {

    return (
      <div className="App">
        <MainScreenWrapper>
          {this.renderMap()}
        </MainScreenWrapper>
        <RightSidePanel>
          {this.renderRightSidePanelContents()}
          {/*FUTURE put a table or some way to filter elections*/}
        </RightSidePanel>
      </div>
    );
  }

  renderMap() {
    if(this.state.geoJsonData) {
      return (
        <LeafletMap
            geojsonData={this.state.geoJsonData}
            choroplethData={this.getPrecintData()}
            union={geoJsonProps => {
              return parseInt(geoJsonProps.label.replace(/\D/g,""))              
            }}
            mouseenter={(layer) => {this.setState({mouseOverFeature: layer})}}
            mouseexit={() => {this.setState({mouseOverFeature: undefined})}}
            getResult={this.getResult.bind(this)}
            axisValues={this.state.selectedMapSetting.value.axisValues}
            colorpallet={this.state.selectedMapSetting.value.colorPallet}
          />
      )
    }
    else {
      return <div></div>
    }
  }

  renderRightSidePanelContents() {
    return (
      <div>
        <ElectionSelect
            electionOptions={this.state.allPossibleElections}
            selectedOption={this.state.electionSelected}
            changeSelectedElection={this.electionDataChanged.bind(this)}
          />
           <RaceSelect
            raceOptions={this.state.allPossibleRaces}
            selectedOption={this.state.raceSelected}
            changeSelectedRace={this.raceSelectionChanged.bind(this)}
          />
          <MapConfigSelect
            mapOptions={this.state.mapSettings}
            selectedOption={this.state.selectedMapSetting}
            changeSelectedOption={this.mapSettingChanges.bind(this)}
          />
          <ElectionDetailWindow
            precintData={this.getPrecintData()}
            highlightedFeature={this.state.mouseOverFeature}
            union={geoJsonProps => {
              return parseInt(geoJsonProps.label.replace(/\D/g,""))              
            }}
            getResult={this.getResult.bind(this)}
          />
      </div>
    )
  }

  getGeoJson() {
    let self = this;
    /*fetch("/geojson/voting_prct.json", {
      method: 'GET',
      headers: {
        "Content-Type" : "application/json"
      }
    })
    .then(function(resp){
      if(!resp.ok) throw new Error(resp.status);

      return resp.json();
    })*/
    new Promise(function(res, rej) {
      let i = 0;
      function poll() {
        i++
        setTimeout(function() {
          if (i >= 50) {rej();}
          if(votingPrct === undefined)
            poll();
          else {
            res(votingPrct);
          }
        },100);
      }
      poll();
    })
    .then(function(json) {
      self.setState({"geoJsonData": json});
    })

  }
  getElections() {
    new Promise(function(resolve, reject) {
      setTimeout(resolve, 10);
    })
    .then(() => {
      this.setState({
        allPossibleElections: [
          {value: "20141104_FranklinPrecincts.6cac1510.csv", label: "Nov 04 2014"},
          {value: "20161108_FranklinPrecincts.82a9d4da.csv", label: "Nov 08 2016"},
          {value: "20170801_FranklinPrecincts.6049b223.csv", label: "Aug 01 2017"},
          {value: "20171107_FranklinPrecincts.3f940d61.csv", label: "Nov 11 2017"},
          {value: "20180807_FranklinPrecincts.3c3b4012.csv", label: "Aug 7 2018"},
          {value: "20181106_FranklinPrecincts.a79e48d7.csv", label: "Nov 6 2018"}
        ],
        //electionSelected : {value: "20141104_FranklinPrecincts.csv", label: "Nov 04 2014"}
      });
      return {value: "20141104_FranklinPrecincts.6cac1510.csv", label: "Nov 04 2014"};
    })
    .then(this.downloadElectionData.bind(this))
  }
  downloadElectionData(selectedRace) {
    const self = this;
    return fetch("static/media/" + selectedRace.value)
      .then(function(resp){
        if(!resp.ok) throw Error(resp.message);
        return resp.text();
      })
      .then(parseCSVElectionData)
      .then((electionJson) => {
        self.setState({
          selectedElectionData: electionJson
        })
      });
  }


}

export default App;

import React, { Component } from 'react';

class SideInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    const data = this.props.precintData;
    if(this.props.highlightedFeature && data) {
      const feature = this.props.highlightedFeature.target.feature;

      let uniqueId;
      if(typeof(this.props.union) === "function") {
          uniqueId = this.props.union(feature.properties);
      }
      else {
          uniqueId = this.props.union;
      }

      let featureValue = this.props.precintData[uniqueId];


      let result = 0;
      let results, sortedFeatures;
      if(typeof(featureValue) === "number") {
          result = featureValue;
      }
      else if (typeof(featureValue) === "object") {

          result = this.props.getResult(featureValue)
      }

      if(featureValue) {
        return (
          <div className={"detailWindow"}>
            <div style={{"margin":"10px 0px"}}>Precinct: {uniqueId}</div>
            
            <table>
              <thead>
                <tr>
                  <th>Vote</th><th>Count</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(featureValue)
                  .sort((a,b) => featureValue[b] - featureValue[a])
                  .map((k,i) => (<tr key={i}><td>{k}:</td><td>{featureValue[k]}</td></tr>))
                }
                </tbody>
              <tfoot>
                <tr>
                  <td>Total:</td>
                  <td>{Object.values(featureValue).reduce((a,b) => a + b,0)}</td>
                </tr>
              </tfoot>
            </table>
            
            
            <div style={{"margin":"10px 0px"}}>
              Result: {Math.abs(result.amount).toFixed(3)}% 
              {result.name ? " in favor of " + result.name : ""}
            </div>


          </div>
        );
      }
    }
    return <div></div>;
  }
}

export default SideInfo;


/*featureValue = this.props.precintData[-1] /*-1 is always Total for entire county
 <table>
  <thead>
    <tr>
      <th>Vote</th><th>Count</th>
    </tr>
  </thead>
  <tbody>
    {Object.keys(featureValue)
      .sort((a,b) => featureValue[b] - featureValue[a])
      .map((k,i) => (<tr key={i}><td>{k}:</td><td>{featureValue[k]}</td></tr>))
    }
    </tbody>
  <tfoot>
    <tr>
      <td>Total:</td>
      <td>{Object.values(featureValue).reduce((a,b) => a + b,0)}</td>
    </tr>
  </tfoot>
</table> */

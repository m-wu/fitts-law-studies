// participantData stores participant ID (pid) and test results (results).
var participantData = {pid: null, device: null, results: {}};

// parameters for the main experiment
var mainConditions = {
    targetWidths: [20, 40, 60],
    targetAmplitudes: [150, 300, 600],
    replication: 15,
    shuffleIndex: [],
    breakInterval: 3
};

// parameters for the practice conditions
var practiceConditions = {
    targetWidths: [60],
    targetAmplitudes: [150],
    replication: 5
};

// for randomizing condition order
var shuffleArray = function (array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
};

// the main class that defines the steps of the experiment
var Experiment = React.createClass({
    componentWillMount: function () {
        document.ontouchmove = function(e) {e.preventDefault()};//disable scrolling & bouncing on touchscreen
        // create a randomized order of the experimental conditions and store in mainConditions.
        mainConditions["shuffleIndex"] = shuffleArray(new Array(
            mainConditions.targetWidths.length * mainConditions.targetAmplitudes.length).fill().map((x, i) => i));
    },
    getInitialState: function () {
        return {step: 1}
    },
    saveParticipantData: function (value) {
        // used by other classes to update participantData
        return function () {
            participantData = Object.assign({}, participantData, value)
        }.bind(this)()
    },
    saveResults: function (result) {
        // used by other classes to update test results
        return function () {
            participantData.results = Object.assign({}, participantData.results, result)
        }.bind(this)()
    },
    nextStep: function () {
        this.setState({step: this.state.step + 1});
    },
    restartExperiment: function() {
        // clear participant data and restart the experiment
        participantData = {pid: null, results: {}};
        this.setState({step: 1});
    },
    render: function () {
        // defines the class to render for each step of the experiment
        switch (this.state.step) {
            case 1: // initial landing page, with input of participant ID
                return <Introduction conditions={mainConditions} participant={participantData}
                                     saveParticipantData={this.saveParticipantData} nextStep={this.nextStep}/>;
            case 2: // title page of practice trials
                return <TrialStart title={"Practice Trials"} instruction={"Instruction for practice."} nextStep={this.nextStep}/>;
            case 3: // practice trials
                return <Trials conditions={practiceConditions} nextStep={this.nextStep}/>;
            case 4: // title page of main experiment 
                return <TrialStart title={"Main Experiment"} instruction={"Instruction for main experiment."} nextStep={this.nextStep}/>;
            case 5: // main trails
                return <Trials conditions={mainConditions} participant={participantData}
                               saveResults={this.saveResults} nextStep={this.nextStep}/>;
            case 6: // result page
                return <Results participant={participantData} restartExperiment={this.restartExperiment}/>
        }
    }
});

var Introduction = React.createClass({
    getInitialState: function () {
        return {pid: '', device: participantData.device}
    },
    onPidChange: function (e) {
        this.setState({pid: e.target.value})
    },
    onDeviceChange: function (e) {
        this.setState({device: e.target.value});
    },
    getActiveBtnClass: function(value) {
        // set button for the correct selected device to active
        var btnClass = "btn btn-default";
        return (value == this.state.device) ? btnClass + " active" : btnClass;
    },
    render: function () {
        return (
            <div className="message">
                <h2>Fitts Law Experiment</h2>
                {/* add instructions below for Introduction page*/}
                <p></p>
                <form>
                    <div className="form-group">
                        <label>Participant ID</label>
                        <input className="form-control" type="text" ref="pid" onChange={this.onPidChange}
                               defaultValue={this.props.participant.pid} placeholder="Participant ID" autoFocus/>
                    </div>
                    <div className="form-group">
                        <label>Device</label>
                        <div className="btn-group btn-group-justified" role="group">
                            <div className="btn-group" role="group">
                                <button value="mouse" className={this.getActiveBtnClass("mouse")}
                                        onClick={this.onDeviceChange} type="button">Mouse</button>
                            </div>
                            <div className="btn-group" role="group">
                                <button value="trackpad" className={this.getActiveBtnClass("trackpad")}
                                        onClick={this.onDeviceChange} type="button">Trackpad</button>
                            </div>
                            <div className="btn-group" role="group">
                                <button value="touchscreen" className={this.getActiveBtnClass("touchscreen")}
                                        onClick={this.onDeviceChange} type="button">Touchscreen</button>
                            </div>
                        </div>
                    </div>
                    <p><label>Widths</label>: {this.props.conditions.targetWidths.join('px, ')+'px'}</p>
                    <p><label>Amplitudes</label>: {this.props.conditions.targetAmplitudes.join('px, ')+'px'}</p>
                    <p><label>Replication</label>: {this.props.conditions.replication}</p>
                    <button className="btn btn-lg btn-primary btn-block" type="submit" onClick={this.nextStep}
                            disabled={!this.state.pid || !this.state.device}>Continue
                    </button>
                </form>
            </div>
        )
    },
    nextStep: function (e) {
        // stores pid and go to the next step
        e.preventDefault();
        if (this.state.pid && this.state.device){
            var data = {pid: this.state.pid, device: this.state.device};
            this.props.saveParticipantData(data);
            this.props.nextStep();
        }
    }
});

var TrialStart = React.createClass({
    render: function () {
        // displays a title, an instruction, and a Continue button
        return (
            <div className="message">
                <h2>{this.props.title}</h2>
                <p>{this.props.instruction}</p>
                <button className="btn btn-lg btn-primary btn-block" onClick={this.props.nextStep}>
                    Start
                </button>
            </div>
        )
    }
});

var Trials = React.createClass({
    getInitialState: function () {
        return {clickCount: 0, rested: false, prevTime: new Date().getTime()}
    },
    getConditionParameter: function () {
        // get the current experimental condition based on the trial number (i.e., clickCount)
        var conditionId = Math.floor(this.state.clickCount / (this.props.conditions.replication + 1));
        if (this.props.conditions.shuffleIndex) {
            conditionId = this.props.conditions.shuffleIndex[conditionId]; // turn ordered condition number into shuffled
        }
        var width = this.props.conditions.targetWidths[conditionId % this.props.conditions.targetWidths.length];
        var amplitude = this.props.conditions.targetAmplitudes[Math.floor(conditionId / this.props.conditions.targetAmplitudes.length)];
        return {width: width, amplitude: amplitude};
    },
    shouldSaveResults: function (trialId) {
        // returns false (i.e., not saving data) for practice trials and first trial of each condition
        return this.props.saveResults && trialId % (this.props.conditions.replication + 1) != 1;
    },
    handleCorrectClick: function () {
        // this is called before handleClick() if the trial is correct
        var trialId = this.state.clickCount + 1;
        if (this.shouldSaveResults(trialId)) {
            var data = {};
            data[trialId] = {correct: true}; // set trial to be correct in the results
            this.props.saveResults(data);
        }
    },
    handleClick: function () {
        // this is called after handleCorrectClick() if the trial is correct
        var trialId = this.state.clickCount + 1;
        if (this.shouldSaveResults(trialId)) {
            var time = new Date().getTime() - this.state.prevTime; // trial completion time

            var existingResult = this.props.participant.results[trialId]; // check if trial has been set to correct
            var correct = existingResult ? existingResult.correct : false;

            var conditionParameter = this.getConditionParameter();
            var amplitude = conditionParameter.amplitude;
            var width = conditionParameter.width;
            var pid = this.props.participant.pid;
            var device = this.props.participant.device;

            var data = {}; // stores result of the trial
            data[trialId] = {pid: pid, device: device, amplitude: amplitude, width: width, time: time, correct: correct};
            this.props.saveResults(data);
        }

        var totalTrials = this.props.conditions.targetWidths.length *
            this.props.conditions.targetAmplitudes.length *
            (this.props.conditions.replication + 1);
        if (trialId == totalTrials) {
            this.props.nextStep(); // go to next step after completing all conditions
        }
        this.setState(function (state) {
            return {clickCount: state.clickCount + 1, rested: false, prevTime: new Date().getTime()};
        });
    },
    handleRested: function () {
        this.setState(function () {
            // set rested to true after a break is taken
            return {rested: true}
        })
    },
    render: function () {
        if (this.state.clickCount > 0
            && (this.state.clickCount % ((this.props.conditions.replication + 1) * this.props.conditions.breakInterval) == 0)
            && !this.state.rested) {
            // show Break page for every breakInterval number of conditions
            return <TrialStart title={"Break"} nextStep={this.handleRested}/>
        }

        // draw the two bars
        var conditionParameter = this.getConditionParameter();
        var width = conditionParameter.width;
        var position = conditionParameter.amplitude / 2;
        var margin = -1 * (position + width) + 'px';

        var targetStyle = {width: width + 'px'};
        var nonTargetStyle = {width: width + 'px'};

        if (this.state.clickCount % 2 == 0) {
            targetStyle['right'] = '50%';
            targetStyle['marginRight'] = margin;
            nonTargetStyle['left'] = '50%';
            nonTargetStyle['marginLeft'] = margin;
        } else {
            targetStyle['left'] = '50%';
            targetStyle['marginLeft'] = margin;
            nonTargetStyle['right'] = '50%';
            nonTargetStyle['marginRight'] = margin;
        }

        return (
            <div id="fitts" onClick={this.handleClick}>
                <div className="bar target" style={targetStyle} onClick={this.handleCorrectClick}></div>
                <div className="bar" style={nonTargetStyle}></div>
            </div>
        );
    }
});

var Results = React.createClass({
    componentWillMount: function () {
        // convert experiment results to CSV string
        var results = this.props.participant.results;
        this.resultStr = 'pid,device,amplitude,width,time,correct\n'; // CSV header
        for (var trialId in results) {
            if (results.hasOwnProperty(trialId)) {
                var data = results[trialId];
                var line = '';
                for (var prop in data) {
                    if (data.hasOwnProperty(prop)) {
                        if (line.length > 0) line += ',';
                        line += data[prop];
                    }
                }
                this.resultStr += line + '\n';
            }
        }
    },
    downloadResults: function () {
        // create a CSV file for download
        var blob = new Blob([this.resultStr], {type: "text/plain;charset=utf-8"});
        var date = new Date();
        var currentDate = [date.getFullYear(), date.getMonth(), date.getDate()].join('');
        var currentTime = [date.getHours(), date.getMinutes(), date.getSeconds()].join('');
        var fileName = "cs444_fitts_" + currentDate + "_" + currentTime + ".csv";
        saveAs(blob, fileName);
    },
    render: function () {
        var minResultRows = 20;
        return (
            <div className="message">
                <h2>Results</h2>
                <p><textarea className="form-control" value={this.resultStr} readOnly
                             rows={Math.min(minResultRows, Object.keys(this.props.participant.results).length+2)}/></p>
                <p>
                    <button className="btn btn-lg btn-primary btn-block" onClick={this.downloadResults}>Save…</button>
                </p>
                <p>
                    <button className="btn btn-lg btn-block" onClick={this.props.restartExperiment}>Restart</button>
                </p>
            </div>
        )
    }
});

React.render(
    <Experiment />,
    document.getElementById('container')
);
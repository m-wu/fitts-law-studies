// participantData stores participant ID (pid), device, and test results (results).
var participantData = {pid: null, device: null, results: {}};

// parameters for the main experiment
var mainConditions = {
    targetWidths: [250, 100],
    sets: ["set1", "set2"],
    numGroupsPerSet: 5,
    numItemsPerGroup: 4,
    conditionOrder: [],
    itemOrders: {}
};

// parameters for the practice conditions
var practiceConditions = {
    targetWidths: [250],
    sets: ["practice"],
    numGroupsPerSet: 1,
    numItemsPerGroup: 2
};

// for randomizing condition order and item order within group
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
    componentDidMount: function () {
        document.ontouchmove = function(e) {e.preventDefault()};//disable scrolling & bouncing on touchscreen
        // read file that contains labels of the images
        var url = "./img/img-labels.json";
        $.getJSON(url, function (jsonObj) {
            // generate a random item order for each group, assuming 4 items per group
            for (var setName in jsonObj){
                mainConditions["itemOrders"][setName] = {};
                for (var groupName in jsonObj[setName]){
                    mainConditions["itemOrders"][setName][groupName] = shuffleArray(new Array(
                        mainConditions.numItemsPerGroup).fill().map((x, i) => i));
                }
            }

            // notify that labels has been read
            if (this.isMounted()) {
                this.setState({labels: jsonObj});
            }
        }.bind(this));

        // randomize the order of the conditions
        mainConditions["conditionOrder"] = shuffleArray(new Array(mainConditions.targetWidths.length)
            .fill().map((x, i) => i));
    },
    getInitialState: function () {
        return {step: 1, labels: {}}
    },
    saveParticipantData: function (value) {
        // used by other classes to update participantData
        return function () {
            participantData = Object.assign({}, participantData, value);
        }.bind(this)()
    },
    saveResults: function (result) {
        // used by other classes to update test results
        return function () {
            participantData.results = Object.assign({}, participantData.results, result)
        }.bind(this)()
    },
    nextStep: function () {
        this.setState({step: this.state.step + 1})
    },
    restartExperiment: function() {
        // clear participant data and restart the experiment
        participantData = {pid: null, results: {}};
        this.setState({step: 1});
    },
    render: function () {
        // defines the class to render for each step of the experiment
        switch (this.state.step) {
            case 1: // initial landing page, with input of participant ID and device
                return <Introduction conditions={mainConditions} participant={participantData}
                                     saveParticipantData={this.saveParticipantData} nextStep={this.nextStep}/>;
            case 2: // title page of practice trials
                return <TrialStart title={"Practice Trials"} instruction = {"Insert instruction for Practice Page"} nextStep={this.nextStep}/>;
            case 3: // practice trials
                return <Trials conditions={practiceConditions} labels={this.state.labels} nextStep={this.nextStep}/>;
            case 4: // title page of main experiment
                return <TrialStart title={"Main Experiment"} instruction = {"Insert instruction for Main Experiment Page"} nextStep={this.nextStep}/>;
            case 5: // main trails
                return <Trials conditions={mainConditions} participant={participantData} labels={this.state.labels}
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
    nextStep: function (e) {
        e.preventDefault();
        if (this.state.pid && this.state.device){
            var data = {pid: this.state.pid, device: this.state.device};
            this.props.saveParticipantData(data);

            if (this.state.device != "touchscreen") {
                document.documentElement.className += "no-touch";
            }
            this.props.nextStep();
        }
    },
    getActiveBtnClass: function(value) {
        // set button for the correct selected device to active
        var btnClass = "btn btn-default";
        return (value == this.state.device) ? btnClass + " active" : btnClass;
    },
    render: function () {
        return (
            <div className="message">
                <h2>Picture-Word Pairs</h2>
                <p>Insert instruction for Introduction Page</p>
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
                    <button className="btn btn-lg btn-primary btn-block" type="submit" onClick={this.nextStep}
                            disabled={!this.state.pid || !this.state.device}>Continue
                    </button>
                </form>
            </div>
        )
    }
});

var TrialStart = React.createClass({
    render: function () {
        // displays a title, an instruction, and a Continue button
        return (
            <div className="message">
                <h2>{this.props.title}</h2>
                <p>{this.props.instruction}</p>
                <button className="btn btn-lg btn-primary btn-block" onClick={this.props.nextStep}>Start</button>
            </div>
        )
    }
});

var Trials = React.createClass({
    getInitialState: function () {
        return {clickCount: 0, clueRevealed: false, rested: false, prevTime: null}
    },
    getConditionValue: function () {
        // get the current experimental condition based on the trial number (i.e., clickCount)
        var numGroupsPerSet = this.props.conditions.numGroupsPerSet;
        var numItemsPerGroup = this.props.conditions.numItemsPerGroup;

        // identify the current set of images
        var setId = Math.floor(this.state.clickCount / (numGroupsPerSet * numItemsPerGroup));
        var setName = this.props.conditions.sets[setId];

        // identify the current image width
        var conditionId = setId;
        if (this.props.conditions.conditionOrder) {
            conditionId = this.props.conditions.conditionOrder[conditionId];  // shuffled order
        }
        var width = this.props.conditions.targetWidths[conditionId];

        // identify the current image group within the set
        var groupId = Math.floor(this.state.clickCount / numItemsPerGroup) % numGroupsPerSet;
        var groupName = "group" + (groupId + 1);

        // identify the current correct image within the group
        var itemId = this.state.clickCount % numItemsPerGroup;
        if (this.props.conditions.itemOrders) {
            itemId = this.props.conditions.itemOrders[setName][groupName][itemId];  // shuffled order
        }

        return {width: width, setName: setName, groupName: groupName, itemId: itemId, conditionId: conditionId};
    },
    handleClick: function (clickTarget) {
        if (!this.state.clueRevealed){
            return;
        }
        var trialId = this.state.clickCount + 1;

        if (this.props.saveResults) {
            var time = new Date().getTime() - this.state.prevTime;  // trial completion time

            var conditionValue = this.getConditionValue();
            var pid = this.props.participant.pid;
            var device = this.props.participant.device;
            var width = conditionValue.width;
            var correct = conditionValue.itemId == clickTarget;  // check if the correct image is clicked

            var data = {};
            data[trialId] = {pid: pid, device: device, width: width, time: time, correct: correct};
            this.props.saveResults(data);
        }

        var totalTrials = this.props.conditions.sets.length * this.props.conditions.numGroupsPerSet *
            this.props.conditions.numItemsPerGroup;
        if (trialId == totalTrials) {
            this.props.nextStep();
        }
        this.setState(function (state) {
            return {clickCount: state.clickCount + 1, clueRevealed: false, rested: false, prevTime: new Date().getTime()};
        });
    },
    revealClue: function () {
        // reveal clue and set the task start time
        $('#clueText').focus();
        this.setState(function () {
            return {clueRevealed: true, prevTime: new Date().getTime()}
        })
    },
    handleRested: function () {
        this.setState(function () {
            // set rested to true after a break is taken
            return {rested: true}
        })
    },
    render: function () {
        if (this.state.clickCount > 0
            && (this.state.clickCount % (this.props.conditions.numGroupsPerSet * this.props.conditions.numItemsPerGroup) == 0)
            && !this.state.rested) {
            // show Break page after each set
            return <TrialStart title={"Break"} nextStep={this.handleRested}/>
        }

        var conditionValue = this.getConditionValue();
        var width = conditionValue.width;
        var setName = conditionValue.setName;
        var groupName = conditionValue.groupName;

        var labels = this.props.labels;
        var clue = Object.keys(labels).length ? labels[setName][groupName][conditionValue.itemId] : "Loading";

        var imagePath = "./img/" + setName + "/" + groupName + "-";
        var imgClass = this.state.clueRevealed ? "target clickable" : "target";
        var imgSize = {width: width + 'px', height: width + 'px'};
        var imgRowMargin = {margin: (165 - width / 2) + 'px 0'};
        var gapWidth = {width: (430 - width) + 'px'};

        return (
            <div id="images">
                <div className="imagerow" style={imgRowMargin}>
                    <img className={imgClass} style={imgSize} src={imagePath+"1.png"} 
                         onClick={this.handleClick.bind(this, 0)} onTouchEnd={this.handleClick.bind(this, 0)}/>
                    <div className="horizontal-gap" style={gapWidth}></div>
                    <img className={imgClass} style={imgSize} src={imagePath+"2.png"} 
                         onClick={this.handleClick.bind(this, 1)} onTouchEnd={this.handleClick.bind(this, 1)}/>
                </div>
                <div id="clue">
                {this.state.clueRevealed ?
                    <span className="label label-default" id="clueText"> {clue} </span> :
                <button className="btn btn-md btn-primary" onClick={this.revealClue} onTouchEnd={this.revealClue}>
                    Next Clue <i className="fa fa-arrow-right"/>
                </button>}
                </div>
                <div className="imagerow" style={imgRowMargin}>
                    <img className={imgClass} style={imgSize} src={imagePath+"3.png"} 
                         onClick={this.handleClick.bind(this, 2)} onTouchEnd={this.handleClick.bind(this, 2)}/>
                    <div className="horizontal-gap" style={gapWidth}></div>
                    <img className={imgClass} style={imgSize} src={imagePath+"4.png"} 
                         onClick={this.handleClick.bind(this, 3)} onTouchEnd={this.handleClick.bind(this, 3)}/>
                </div>
            </div>

        );
    }
});

var Results = React.createClass({
    getInitialState: function () {
        return {gistUrl: null}
    },
    componentWillMount: function () {
        // convert experiment results to CSV string
        var results = this.props.participant.results;
        this.resultStr = 'pid,device,width,time,correct\n';
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
        var date = new Date();
        var currentDate = [date.getFullYear(), date.getMonth(), date.getDate()].join('');
        var currentTime = [date.getHours(), date.getMinutes(), date.getSeconds()].join('');
        this.fileName = "cs444_pwp_" + currentDate + "_" + currentTime + ".csv";
    },
    downloadResults: function () {
        // create a CSV file for download
        var blob = new Blob([this.resultStr], {type: "text/plain;charset=utf-8"});
        saveAs(blob, this.fileName);
    },
    saveToGist: function() {
        // upload result file to gist and set the gist URL in the state
        var data = {
            "description": "UBC CS444: Results of the Picture-Word Pairs Experiment",
            "public": true,
            "files": {}
        };
        data["files"][this.fileName] = {"content": this.resultStr};

        $.post('https://api.github.com/gists', JSON.stringify(data), function(response) {
            console.log(response.html_url);
            if (this.isMounted()) {
                this.setState({gistUrl: response.html_url});
            }
        }.bind(this));
    },
    render: function () {
        var minResultRows = 20;
        return (
            <div className="message">
                <h2>Results</h2>
                <p>Insert instruction for Result Page</p>
                <p><textarea className="form-control" value={this.resultStr} readOnly
                             rows={Math.min(minResultRows, Object.keys(this.props.participant.results).length+2)}/></p>
                <p>
                    <button className="btn btn-lg btn-primary btn-block" onClick={this.downloadResults}>
                        <i className="fa fa-floppy-o"/> Save to Local…</button>
                </p>
                <div className={this.state.gistUrl ? 'hidden' : ''}>
                    <p><button className="btn btn-lg btn-info btn-block" onClick={this.saveToGist}>
                        <i className="fa fa-cloud-upload"/> Get Gist URL</button></p>
                </div>
                <div className={this.state.gistUrl ? '' : 'hidden'}>
                    <p>
                        <pre>{this.state.gistUrl}</pre>
                        <a className="btn btn-lg btn-success btn-block" href={this.state.gistUrl} role="button"
                           target="_blank"><i className="fa fa-external-link"/> Open in Gist…</a>
                    </p>
                </div>
                <p>
                    <button className="btn btn-lg btn-block" onClick={this.props.restartExperiment}>Restart</button>
                </p>
            </div>
        )
    }
});

ReactDOM.render(
    <Experiment />,
    document.getElementById('container')
);


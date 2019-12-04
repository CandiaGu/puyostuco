var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var puyoColorCount = 4;
// Cell Class

var Cell = function (_React$Component) {
    _inherits(Cell, _React$Component);

    function Cell() {
        _classCallCheck(this, Cell);

        return _possibleConstructorReturn(this, (Cell.__proto__ || Object.getPrototypeOf(Cell)).apply(this, arguments));
    }

    _createClass(Cell, [{
        key: "getValue",
        value: function getValue() {
            var value = this.props.value;


            if (!value.isRevealed) {
                return this.props.value.isFlagged ? "🚩" : null;
            }
            if (value.isMine) {
                return "💣";
            }
            if (value.neighbour === 0) {
                return null;
            }
            return value.neighbour;
        }
    }, {
        key: "render",
        value: function render() {
            var _props = this.props,
                value = _props.value,
                onClick = _props.onClick,
                cMenu = _props.cMenu;

            var className = "cell cell" + value.puyoColor;

            return React.createElement(
                "div",
                {
                    className: className,
                    onContextMenu: cMenu
                },
                this.getValue()
            );
        }
    }]);

    return Cell;
}(React.Component);

// Board Class


var Board = function (_React$Component2) {
    _inherits(Board, _React$Component2);

    function Board(props) {
        _classCallCheck(this, Board);

        var _this2 = _possibleConstructorReturn(this, (Board.__proto__ || Object.getPrototypeOf(Board)).call(this, props));

        _this2.state = {
            boardData: _this2.initBoardData(_this2.props.height, _this2.props.width),
            gameStatus: "Game in progress",
            mineCount: _this2.props.mines,
            currPuyo1: [2, 0], //[x,y]
            currPuyo2: [2, 1]
        };

        _this2.moveCurrPuyo = _this2.moveCurrPuyo.bind(_this2);
        _this2.keyControlsFunction = _this2.keyControlsFunction.bind(_this2);
        _this2.spawnPuyo = _this2.spawnPuyo.bind(_this2);
        return _this2;
    }

    /* Helper Functions */
    // Gets initial board data


    _createClass(Board, [{
        key: "initBoardData",
        value: function initBoardData(height, width) {
            var data = this.spawnPuyo(this.createEmptyArray(height, width));
            return data;
        }
    }, {
        key: "spawnPuyo",
        value: function spawnPuyo(data) {
            //spawn puyo
            //third column vertical
            data[0][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
            data[1][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
            return data;
        }
    }, {
        key: "spawnNewPuyo",
        value: function spawnNewPuyo() {

            var data = this.state.boardData;
            data[0][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;
            data[1][2].puyoColor = Math.floor(Math.random() * puyoColorCount) + 1;

            this.setState({ boardData: data,
                currPuyo1: [2, 0], //[x,y]
                currPuyo2: [2, 1] });
        }
    }, {
        key: "createEmptyArray",
        value: function createEmptyArray(height, width) {
            var data = [];

            for (var i = 0; i < height; i++) {
                data.push([]);
                for (var j = 0; j < width; j++) {
                    data[i][j] = {
                        x: i,
                        y: j,
                        isEmpty: false,
                        puyoColor: 0
                    };
                }
            }
            return data;
        }
    }, {
        key: "dropCurrPuyo",
        value: function dropCurrPuyo() {}
    }, {
        key: "findLowestPosition",
        value: function findLowestPosition(col) {
            var data = this.state.boardData;
            for (var i = this.props.height - 1; i > 0; i--) {
                if (data[i][col].puyoColor == 0) {
                    return i;
                }
            }
            return -1;
        }
        //move relatively

    }, {
        key: "moveCurrPuyo",
        value: function moveCurrPuyo(x, y) {

            var currPuyo1 = this.state.currPuyo1;
            var currPuyo2 = this.state.currPuyo2;
            var newPuyo1 = [currPuyo1[0] + x, currPuyo1[1] + y];
            var newPuyo2 = [currPuyo2[0] + x, currPuyo2[1] + y];

            //check if legal move
            if (newPuyo1[0] < 0 || newPuyo1[0] > this.props.width - 1 || newPuyo1[1] < 0 || newPuyo1[1] > this.findLowestPosition(newPuyo1[0]) || newPuyo2[0] < 0 || newPuyo2[0] > this.props.width - 1 || newPuyo2[1] < 0 || newPuyo2[1] > this.findLowestPosition(newPuyo1[0])) return;

            console.log(currPuyo1 + " " + currPuyo2);
            console.log(newPuyo1 + " " + newPuyo2);

            var data = this.state.boardData;

            var color1 = data[currPuyo1[1]][currPuyo1[0]].puyoColor;
            var color2 = data[currPuyo2[1]][currPuyo2[0]].puyoColor;
            data[currPuyo1[1]][currPuyo1[0]].puyoColor = 0;
            data[currPuyo2[1]][currPuyo2[0]].puyoColor = 0;
            data[newPuyo1[1]][newPuyo1[0]].puyoColor = color1;
            data[newPuyo2[1]][newPuyo2[0]].puyoColor = color2;

            this.setState({
                currPuyo1: [newPuyo1[0], newPuyo1[1]],
                currPuyo2: [newPuyo2[0], newPuyo2[1]],
                boardData: data
            });

            //if at bottom start timer
            if (newPuyo1[1] == Math.max(this.findLowestPosition(newPuyo1[0]), newPuyo1[1]) || newPuyo2[1] == Math.max(this.findLowestPosition(newPuyo2[0], newPuyo2[1]))) setTimeout(this.spawnNewPuyo.bind(this), 2000);
        }
    }, {
        key: "keyControlsFunction",
        value: function keyControlsFunction(event) {
            if (event.key === "ArrowUp") {
                this.dropCurrPuyo();
            } else if (event.key === "ArrowLeft") {
                this.moveCurrPuyo(-1, 0);
            } else if (event.key === "ArrowRight") {
                this.moveCurrPuyo(1, 0);
            } else if (event.key === "ArrowDown") {
                this.moveCurrPuyo(0, 1);
            }
        }
    }, {
        key: "componentDidMount",
        value: function componentDidMount() {
            document.addEventListener("keydown", this.keyControlsFunction, false);
        }
    }, {
        key: "rotatePuyo",
        value: function rotatePuyo() {}

        // get number of neighbouring mines for each board cell

    }, {
        key: "getNeighbours",
        value: function getNeighbours(data, height, width) {
            var _this3 = this;

            var updatedData = data,
                index = 0;

            for (var i = 0; i < height; i++) {
                for (var j = 0; j < width; j++) {
                    if (data[i][j].isMine !== true) {
                        (function () {
                            var mine = 0;
                            var area = _this3.traverseBoard(data[i][j].x, data[i][j].y, data);
                            area.map(function (value) {
                                if (value.isMine) {
                                    mine++;
                                }
                            });
                            if (mine === 0) {
                                updatedData[i][j].isEmpty = true;
                            }
                            updatedData[i][j].neighbour = mine;
                        })();
                    }
                }
            }

            return updatedData;
        }
    }, {
        key: "_handleContextMenu",


        // Handle User Events

        value: function _handleContextMenu(e, x, y) {
            e.preventDefault();
            var updatedData = this.state.boardData;
            var mines = this.state.mineCount;

            // check if already revealed
            if (updatedData[x][y].isRevealed) return;

            if (updatedData[x][y].isFlagged) {
                updatedData[x][y].isFlagged = false;
                mines++;
            } else {
                updatedData[x][y].isFlagged = true;
                mines--;
            }

            if (mines === 0) {
                var mineArray = this.getMines(updatedData);
                var FlagArray = this.getFlags(updatedData);
                if (JSON.stringify(mineArray) === JSON.stringify(FlagArray)) {
                    this.setState({ mineCount: 0, gameStatus: "You Win." });
                    this.revealBoard();
                    alert("You Win");
                }
            }

            this.setState({
                boardData: updatedData
            });
        }
    }, {
        key: "renderBoard",
        value: function renderBoard(data) {
            var _this4 = this;

            return data.map(function (datarow) {
                return datarow.map(function (dataitem) {
                    return React.createElement(
                        "div",
                        { key: dataitem.x * datarow.length + dataitem.y },
                        React.createElement(Cell, {
                            cMenu: function cMenu(e) {
                                return _this4._handleContextMenu(e, dataitem.x, dataitem.y);
                            },
                            value: dataitem
                        }),
                        datarow[datarow.length - 1] === dataitem ? React.createElement("div", { className: "clear" }) : ""
                    );
                });
            });
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                { className: "board" },
                this.renderBoard(this.state.boardData)
            );
        }
    }]);

    return Board;
}(React.Component);

// Game Class


var Game = function (_React$Component3) {
    _inherits(Game, _React$Component3);

    function Game() {
        var _ref;

        var _temp, _this5, _ret2;

        _classCallCheck(this, Game);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret2 = (_temp = (_this5 = _possibleConstructorReturn(this, (_ref = Game.__proto__ || Object.getPrototypeOf(Game)).call.apply(_ref, [this].concat(args))), _this5), _this5.state = {
            height: 12,
            width: 6,
            mines: 0
        }, _temp), _possibleConstructorReturn(_this5, _ret2);
    }

    _createClass(Game, [{
        key: "render",
        value: function render() {
            var _state = this.state,
                height = _state.height,
                width = _state.width,
                mines = _state.mines;

            return React.createElement(
                "div",
                { className: "game-wrapper" },
                React.createElement(
                    "div",
                    null,
                    "time"
                ),
                React.createElement(
                    "div",
                    { className: "margin-auto" },
                    React.createElement(
                        "div",
                        { className: "game" },
                        React.createElement(Board, { height: height, width: width, mines: mines })
                    )
                ),
                React.createElement(
                    "div",
                    null,
                    "preview"
                )
            );
        }
    }]);

    return Game;
}(React.Component);

var domContainer = document.querySelector('#game');
ReactDOM.render(React.createElement(Game, null), domContainer);

//disable default for arrow keys
window.addEventListener("keydown", function (e) {
    // space and arrow keys
    if ([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);
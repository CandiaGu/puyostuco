const Cell = (props) => {
  const {
    dataitem,
    currPuyo1,
    currPuyo2,
    isOffset,
  } = props;
  let puyo = dataitem;
  let isActive = true;
  if (dataitem.x === currPuyo1.x && dataitem.y === currPuyo1.y) {
    puyo = currPuyo1;
  } else if (dataitem.x === currPuyo2.x && dataitem.y === currPuyo2.y) {
    puyo = currPuyo2;
  } else {
    isActive = false;
  }
  let name = 'cell cell' + puyo.puyoColor;
  if (isActive) {
    name += ' active';
    if (isOffset) {
      name += ' offset';
    }
  }
  return <div className={name} />;
};

const { shape, number, bool } = PropTypes;
const puyoPropTypes = shape({ x: number, y: number, puyoColor: number });
Cell.propTypes = {
  dataitem: puyoPropTypes.isRequired,
  currPuyo1: puyoPropTypes.isRequired,
  currPuyo2: puyoPropTypes.isRequired,
  isOffset: bool.isRequired,
};

export default Cell;

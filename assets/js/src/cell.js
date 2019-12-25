const Cell = (props) => {
  const {
    dataitem,
    currPuyo1,
    currPuyo2,
    isOffset,
    splitPuyo,
    fps,
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
  let className = 'cell cell' + puyo.color;
  if (isActive) {
    className += ' active';
    if (isOffset) {
      className += ' offset';
    }
  } else {
    className += ' ' + dataitem.state;
  }
  if (splitPuyo.x === puyo.x && splitPuyo.y === puyo.y) {
    const {
      velocity: v0,
      acceleration: a,
      onAnimationEnd,
      distance: d,
    } = splitPuyo;
    const v = Math.sqrt(v0 * v0 + 2 * a * d);
    const style = {
      '--d': d,
      '--t': (2.0 * d) / (v + v0) / fps,
      '--y': v0 / 3.0,
    };
    return <div className={className} style={style} onAnimationEnd={onAnimationEnd} />;
  }
  return <div className={className} />;
};

const {
  shape,
  number,
  string,
  bool,
  func,
} = PropTypes;
Cell.propTypes = {
  dataitem: shape({
    x: number,
    y: number,
    color: number,
    state: string,
  }).isRequired,
  currPuyo1: shape({ x: number, y: number, color: number }).isRequired,
  currPuyo2: shape({ x: number, y: number, color: number }).isRequired,
  isOffset: bool.isRequired,
  splitPuyo: shape({
    x: number,
    velcotiy: number,
    acceleration: number,
    onAnimationEnd: func,
  }).isRequired,
  fps: number.isRequired,
};

export default Cell;

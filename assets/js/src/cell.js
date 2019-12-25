const Cell = (props) => {
  const { color, classList } = props;
  const className = 'cell cell' + color + classList.reduce((acc, cur) => acc + ' ' + cur, '');
  if (classList.includes('falling')) {
    const { style, onAnimationEnd } = props;
    return <div className={className} style={style} onAnimationEnd={onAnimationEnd} />;
  }
  return <div className={className} />;
};

const {
  number,
  arrayOf,
  string,
  shape,
  func,
} = PropTypes;
Cell.propTypes = {
  color: number.isRequired,
  classList: arrayOf(string).isRequired,
  style: shape({ '--d': number.isRequired, '--t': number.isRequired, '--y': number.isRequired }),
  onAnimationEnd: func,
};

export default Cell;

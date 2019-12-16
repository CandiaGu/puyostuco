const Cell = ({ value: { puyoColor } }) => <div className={'cell cell' + puyoColor} />;

Cell.propTypes = {
  value: PropTypes.shape({
    puyoColor: PropTypes.number,
  }).isRequired,
};

export default Cell;

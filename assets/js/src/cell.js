const Cell = ({ value: { puyoColor }, active }) => (
  <div className={'cell cell' + puyoColor + (active ? ' active' : '')} />
);

Cell.propTypes = {
  value: PropTypes.shape({ puyoColor: PropTypes.number }).isRequired,
  active: PropTypes.bool.isRequired,
};

export default Cell;

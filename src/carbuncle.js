import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import './carbuncle-widget/js.js';
import './carbuncle-widget/css.css';

const Carbuncle = (props) => {
  const { location } = props;
  const visible = location.pathname.slice(1) === '';
  return (
    <div className="carbuncle" style={{ visibility: visible ? 'visible' : 'hidden' }}>
      <div className="carby-box" style={{ visibility: 'hidden' }}>
        <div className="carby" />
      </div>
    </div>
  );
};

const {
  shape,
  string,
} = PropTypes;

Carbuncle.propTypes = {
  location: shape({
    pathname: string.isRequired,
  }).isRequired,
};

export default withRouter(Carbuncle);

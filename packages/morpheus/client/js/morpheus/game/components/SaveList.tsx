import React from 'react'
import PropTypes from 'prop-types'
import './SaveList.css'

const SaveList = ({ loading, delegate, rows, onSelect }: any) => {
  if (loading) {
    return (
      <div className="saveListModal">
        <span className="loadingSpinner" />
      </div>
    )
  }
  // if (error) {
  //   return (
  //     <div className="saveListModal">
  //       <span className="saveErrorAlert" />
  //     </div>
  //   );
  // }
  return (
    <div className="saveListModal">
      {/* <SelectionList
        delegate={delegate}
        rows={rows}
        onSelect={onSelect}
      /> */}
    </div>
  )
}

SaveList.propTypes = {
  loading: PropTypes.bool.isRequired,
  delegate: PropTypes.func,
  rows: PropTypes.number,
  onSelect: PropTypes.func,
}

SaveList.defaultProps = {
  delegate: () => null,
  rows: 0,
  onSelect: () => {},
}

export default SaveList

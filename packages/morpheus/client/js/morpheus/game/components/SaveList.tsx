import React, { FunctionComponent } from 'react'
import PropTypes from 'prop-types'

const saveListModalStyle: React.CSSProperties = {
  textAlign: 'center',
  position: 'absolute',
  borderRadius: 10,
  padding: 20,
  backgroundColor: '#444',
  width: '20em',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
}

type SaveListProps = {
  loading: boolean
  delegate?: () => void
  rows?: number
  onSelect?: () => void
}

const SaveList: FunctionComponent<SaveListProps> = ({
  loading,
  delegate,
  rows,
  onSelect,
}) => {
  if (loading) {
    return (
      <div style={saveListModalStyle}>
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
  return <div style={saveListModalStyle} />
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

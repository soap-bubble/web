import React from 'react';
import SettingsLeftPanel from '../containers/SettingsLeftPanel';

const Page = ({
  active,
}) => (
  <div className="container">
    <div className="row">
      <div className="col-lg-4 col-xl-3 col-md-12">
        <SettingsLeftPanel activeKey={active} />
      </div>
      <div className="col-lg-8 col-xl-9 col-md-12">
        Content
      </div>
    </div>
  </div>
);

export default Page;

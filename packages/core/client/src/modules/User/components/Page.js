import React from 'react';
import UserSectionSelectionLeft from '../containers/UserSectionSelectionLeft';

const Page = ({
  active,
}) => (
  <div className="container">
    <div className="row">
      <div className="col-lg-4 col-xl-3 col-md-12">
        <UserSectionSelectionLeft activeKey={active} />
      </div>
      <div className="col-lg-8 col-xl-9 col-md-12">
        Content
      </div>
    </div>
  </div>
);

export default Page;

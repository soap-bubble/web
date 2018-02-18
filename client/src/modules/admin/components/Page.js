import React from 'react';
import AdminLeftPanel from '../containers/AdminLeftPanel';

const Page = ({
  children,
}) => (
  <div className="container">
    <div className="row">
      <div className="col-lg-4 col-xl-3 col-md-12">
        <AdminLeftPanel />
      </div>
      <div className="col-lg-8 col-xl-9 col-md-12">
        {children}
      </div>
    </div>
  </div>
);

export default Page;

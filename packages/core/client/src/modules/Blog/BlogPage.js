import React from 'react';
import cn from 'classnames';
import Sidebar from './SidebarContainer';
import styles from './BlogPage.css';

const BlogPage = ({
  children,
  init,
  params: { slug }
}) => {
  return (
    <div ref={(el) => {
      if (el) {
        init();
      }
    }} className={cn('container', styles.root)}>
      <div className="row">
        <div className="col-lg-8 col-xl-9 col-md-12">
          {children}
        </div>
        <div className="col-lg-4 col-xl-3 col-md-12">
          <Sidebar slug={slug}/>
        </div>
      </div>
    </div>
  );
};

export default BlogPage;

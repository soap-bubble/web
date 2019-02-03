import React, { Fragment } from 'react';
import { get, first } from 'lodash';
import cn from 'classnames';
import { LinkContainer } from 'react-router-bootstrap';
import styles from './Sidebar.css';

const Sidebar = ({
  entries,
  init,
  slug: propSlug,
}) => {
  const slug = propSlug || get(first(entries), 'fields.slug');
  return (
    <Fragment>
      <div className={cn(styles.title)}>
        Recent Posts
      </div>
      <ul className={styles.list}>
        {entries.map(entry => (
          <LinkContainer key={entry.fields.slug} to={`/blog/${entry.fields.slug}`}>
            <li className={cn({
              [styles.item]: true,
              active: entry.fields.slug === slug,
            })}>
              <a className={cn(styles.link)}>
                <span className={cn({
                  [styles.disclosure]: entry.fields.slug === slug,
                })} />
                {entry.fields.title}
              </a>
            </li>
          </LinkContainer>
        ))}
      </ul>
    </Fragment>
  );
};

export default Sidebar;

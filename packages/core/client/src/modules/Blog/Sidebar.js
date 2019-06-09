import React, { Fragment } from 'react';
import { get, first } from 'lodash';
import cn from 'classnames';
import styles from './Sidebar.css';

const Sidebar = ({
  entries,
  init,
  slug: propSlug,
  onEntry,
}) => {
  const slug = propSlug || get(first(entries), 'fields.slug');
  return (
    <Fragment>
      <div className={cn(styles.title)}>
        Recent Posts
      </div>
      <ul className={styles.list}>
        {entries.map(entry => (
          <li
            className={cn({
              [styles.item]: true,
              active: entry.fields.slug === slug,
            })}
            onClick={() => onEntry(entry.fields.slug)}
          >
            <a className={cn(styles.link)}>
              <span className={cn({
                [styles.disclosure]: entry.fields.slug === slug,
              })} />
              {entry.fields.title}
            </a>
          </li>
        ))}
      </ul>
    </Fragment>
  );
};

export default Sidebar;

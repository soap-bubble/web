import React, { Fragment } from 'react';
import { first, get } from 'lodash';
import cn from 'classnames';
import styles from './BlogEntries.css';
import BlogEntry from './BlogEntryContainer';

const BlogEntries = ({
  entries,
}) => {
  if (entries.length) {
    const slug = get(first(entries), 'fields.slug');
    return (
      <BlogEntry params={{ slug }} />
    );
  }
  return null;
};

export default BlogEntries;

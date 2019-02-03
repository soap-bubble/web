import React, { Component } from 'react';
import { get } from 'lodash';
import cn from 'classnames';
import RichText from '@madebyconnor/rich-text-to-jsx';
import { richTextFromMarkdown } from '@contentful/rich-text-from-markdown';

import styles from './BlogEntry.css';

class BlogEntry extends Component {
  constructor() {
    super();
    this.state = {
      document: null,
    };
  }

  componentDidMount() {
    this.setState({
      entry: this.props.entries.find(e => e.fields.slug === this.props.params.slug),
      bodyPromise: null,
      document: null,
    });
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.props.params.slug && prevProps.entries.length !== this.props.entries.length
      || this.props.params.slug !== prevProps.params.slug
    ) {
      this.setState({
        entry: this.props.entries.find(e => e.fields.slug === this.props.params.slug),
        bodyPromise: null,
        document: null,
      });
    }
    if (!this.state.document && !this.state.bodyPromise && this.state.entry) {
      const { entry } = this.state;
      this.setState({
        bodyPromise: richTextFromMarkdown(entry.fields.body).then(document => this.setState({
          document,
        })),
      })
    }
  }

  render() {
    const {
      entries,
      assets,
      params: { slug },
    } = this.props;
    const {
      document,
    } = this.state;

    const entry = entries.find(e => e.fields.slug === slug);
    const imgUrl = entry && get(assets.find(asset => asset.sys.id === entry.fields.heroImage.sys.id), 'fields.file.url');
    const richText = entry && document;

    return entry ? (
      <div className={styles.root}>
        <h2>
          {entry.fields.title}
        </h2>
        <span>
          <img className={cn(styles.image)} src={imgUrl} />
        </span>
        <p>
          {entry.fields.description}
        </p>
        <RichText richText={richText} />
      </div>
    ) : null;
  }
}

export default BlogEntry;

import React from 'react';
import Page from '../components/Page';
import About from '../components/About';
import Examples from '../containers/Examples';
import Login from '../containers/Login';
import Settings from '../containers/Settings';
import { Page as User } from '../modules/User';
import { Page as BlogPage, Entries, Entry } from '../modules/Blog';
import Privacy from '../containers/Privacy';
import {
  Page as Admin,
  Users as AdminUsers,
  Bot as AdminBot,
} from 'app/modules/admin';

export default {
  ['route/HOME']: {
    path: '/',
    component: () => (
      <Page>
        <About />
      </Page>
    ),
  },
  ['route/ABOUT']: {
    path: '/about',
    component: () => (
      <Page>
        <About />
      </Page>
    ),
  },
  ['route/EXAMPLES']: {
    path: '/examples',
    component: () => (
      <Page>
        <Examples />
      </Page>
    ),
  },
  ['route/BLOG']: {
    path: '/blog',
    component: () => (
      <Page>
        <BlogPage>
          <Entries />
        </BlogPage>
      </Page>
    ),
  },
  ['route/BLOG_ARTICLE']: {
    path: '/blog/:slug',
    component: () => (
      <Page>
        <BlogPage>
          <Entry />
        </BlogPage>
      </Page>
    ),
  },
  ['route/LOGIN']: {
    path: '/login',
    component: () => (
      <Page>
        <Login />
      </Page>
    ),
  },
  ['route/SETTINGS']: {
    path: '/settings',
    component: () => (
      <Page>
        <Settings />
      </Page>
    ),
  },
  ['route/PRIVACY']: {
    path: '/privacy',
    component: () => (
      <Page>
        <Privacy />
      </Page>
    ),
  },
  ['route/ADMIN']: {
    path: '/admin',
    component: () => (
      <Page>
        <Admin />
      </Page>
    ),
  },
  ['route/ADMIN_USERS']: {
    path: '/admin/users',
    component: () => (
      <Page>
        <Admin>
          <AdminUsers />
        </Admin>
      </Page>
    ),
  },
  ['route/ADMIN_BOT']: {
    path: '/admin/bot',
    component: () => (
      <Page>
        <Admin>
          <AdminBot />
        </Admin>
      </Page>
    ),
  },
};

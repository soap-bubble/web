const login = {
  selectors: {
    isLoggedIn: () => login.__test.isLoggedIn,
  },
  actions: {},
  reducers: state => state,
  __test: {
    isLoggedIn: false,
  },
};

module.exports = login;

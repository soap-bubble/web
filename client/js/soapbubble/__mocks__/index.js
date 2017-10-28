const soapbubble = {
  login: {
    selectors: {
      isLoggedIn: () => soapbubble.__test.isLoggedIn,
    },
    actions: {},
    reducers: state => state,
  },
  __test: {
    isLoggedIn: false,
  },
};

module.exports = soapbubble;

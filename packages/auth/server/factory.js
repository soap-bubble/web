import builder from 'service-builder';

let blueprints = builder();

export function define(providers) {
  blueprints = blueprints.define(providers);
}

let factory;

export function init(deps) {
  factory = blueprints.construct(deps);
  return factory;
}

export default function create(functor) {
  if (!factory) {
    throw new Error('Need to init factory first');
  }
  return factory.$(functor);
}

import builder from 'service-builder';

const blueprints = builder();

export function define(providers) {
  blueprints.define(providers);
}

let factory;

export function init(deps) {
  factory = blueprints.construct(deps);
}

export default function create(functor) {
  if (!factory) {
    factory = init();
  }
  return factory.$(functor);
}

import memoize from 'lodash.memoize';
import i18n from 'i18n-js';

const Translate = memoize(
    (key, config) => i18n.t(key, config),
    (key, config) => (config ? key + JSON.stringify(config) : key)
);

export default Translate
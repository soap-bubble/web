import { clientConfiguration } from 'universal-webpack'
import settings from './universal-webpack-settings'
import configuration from './webpack.config'

export default function(options, webpackConfig)
{
	return clientConfiguration(Object.assign(configuration, webpackConfig), settings, options)
}

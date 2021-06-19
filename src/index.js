import freesewing from '@freesewing/core'
import plugins from '@freesewing/plugin-bundle'
import config from '../config'
import draftNeckBase from './neckBase'
import draftBack from './back'
import draftBase from './base'
import draftFront from './front'
import draftSleeve from './sleeve'

// Create new design
const Pattern = new freesewing.Design(config, plugins)

// Attach the draft methods to the prototype
Pattern.prototype.draftNeckBase = draftNeckBase
Pattern.prototype.draftBase = draftBase
Pattern.prototype.draftBack = draftBack
Pattern.prototype.draftFront = draftFront
Pattern.prototype.draftSleeve = draftSleeve

export default Pattern

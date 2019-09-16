import { reducer as user } from 'app/modules/User'
import { reducer as admin } from 'app/modules/admin'
import { reducer as users } from 'app/modules/users'
import { reducer as blog } from 'app/modules/Blog'
import examples from './example'
import page from './page'

export default {
  examples,
  page,
  user,
  admin,
  users,
  blog,
}

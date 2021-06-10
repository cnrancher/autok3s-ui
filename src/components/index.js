import Alert from './Alert'
import Button from './Button'
import {Collapse, CollapseItem} from './Collapse'
import ComboBox from './ComboBox'
import {Dropdown, DropdownMenu, DropdownMenuItem} from './Dropdown'
import Icon from './Icon'
import {PasswordInput, Input} from './Input'
import Loading from './Loading'
import Modal from './Modal'
import Notification from './Notification'
import Pagination from './Pagination'
import { Radio, RadioButton, RadioGroup } from './Radio'
import {Select, Option} from './Select'
import { BaseTable, TableColumn, Table } from './Table'
import { Tabs, TabPane } from './Tabs'
import Tag from './Tag'
import Tooltip from './Tooltip'

const components = [
  Alert,
  Button,
  Collapse,
  CollapseItem,
  ComboBox,
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  Icon,
  PasswordInput,
  Input,
  Loading,
  Modal,
  Notification,
  Pagination,
  Radio,
  RadioButton,
  RadioGroup,
  Select,
  Option,
  BaseTable,
  TableColumn,
  Table,
  Tabs,
  TabPane,
  Tag,
  Tooltip
]

const install = (app) => {
  components.forEach(component => {
    app.component(component.name, component)
  })
}

export {
  Alert,
  Button,
  Collapse,
  CollapseItem,
  ComboBox,
  Dropdown,
  DropdownMenu,
  DropdownMenuItem,
  Icon,
  PasswordInput,
  Input,
  Loading,
  Modal,
  Notification,
  Pagination,
  Radio,
  RadioButton,
  RadioGroup,
  Select,
  Option,
  BaseTable,
  TableColumn,
  Table,
  Tabs,
  TabPane,
  Tag,
  Tooltip
}
export default { install }
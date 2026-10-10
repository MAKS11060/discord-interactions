import {
  type APIActionRowComponent,
  type APIButtonComponent,
  type APIComponentInMessageActionRow,
  type APIMessageTopLevelComponent,
  ButtonStyle,
  ComponentType,
} from 'discord-api-types/v10'

const LF = '\n'
const CRLF = '\r\n'

export class ComponentBuilder {
  result: APIMessageTopLevelComponent[] = []
  parent: any = []

  constructor(
    readonly options?: {
      /**
       * @default true
       */
      autoNewLine?: boolean
      /**
       * @default 'lf''
       */
      newLineKind?: 'lf' | 'crlf'
    },
  ) {}

  /**
   * Container to display a row of interactive components
   */
  actionRow(
    cb: (
      row: Pick<
        ComponentBuilder,
        'button' | 'stringSelect' | 'userSelect' | 'roleSelect' | 'mentionableSelect' | 'channelSelect'
      >,
    ) => void,
  ) {
    const row: APIMessageTopLevelComponent = {
      type: ComponentType.ActionRow,
      components: [],
    }
    this.result.push(row)

    const componentBuilder = new ComponentBuilder()
    componentBuilder.parent = row
    cb(componentBuilder)

    return this
  }

  button(options: APIButtonComponent) {
    const target = this.parent as APIComponentInMessageActionRow[]

    target.push({
      ...options,
      type: ComponentType.Button,
    } as APIButtonComponent)

    return this
  }

  stringSelect() {
    ComponentType.StringSelect

    return this
  }

  textInput() {
    ComponentType.TextInput

    return this
  }

  userSelect() {
    ComponentType.UserSelect

    return this
  }

  roleSelect() {
    ComponentType.RoleSelect

    return this
  }

  mentionableSelect() {
    ComponentType.MentionableSelect

    return this
  }

  channelSelect() {
    ComponentType.ChannelSelect

    return this
  }

  section() {
    ComponentType.Section

    return this
  }

  /**
   * Markdown text
   */
  textDisplay() {
    ComponentType.ChannelSelect

    return this
  }

  thumbnail() {
    ComponentType.Thumbnail

    return this
  }

  mediaGallery() {
    ComponentType.MediaGallery

    return this
  }

  file() {
    ComponentType.File

    return this
  }

  separator() {
    ComponentType.Separator

    return this
  }

  container() {
    ComponentType.Container

    return this
  }

  label() {
    ComponentType.Label

    return this
  }

  fileUpload() {
    ComponentType.FileUpload

    return this
  }

  radioGroup() {
    ComponentType.RadioGroup

    return this
  }

  checkboxGroup() {
    ComponentType.CheckboxGroup

    return this
  }

  checkbox() {
    ComponentType.Checkbox

    return this
  }
}

// class ButtonComponent {
//   constructor() {}
//   style(style: ButtonStyle) {}
// }

//
new ComponentBuilder()
  .actionRow((row) => {
    // row.button()
  })

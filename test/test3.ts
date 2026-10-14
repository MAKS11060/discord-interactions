import {bigint} from 'zod'

// 1. Вспомогательный класс, который прокидывается в коллбэк как аргумент `t`
class TypeHelper {
  // Этот метод существует ТОЛЬКО для протаскивания типа на уровень TypeScript.
  // В рантайме он может возвращать undefined или дефолтное значение.
  public $type<T>(defaultValue?: T): T {
    return defaultValue as T
  }
}

// 2. Интерфейс, описывающий структуру, которую должен вернуть разработчик
interface SchemaDefinition {
  Context?: object
  CustomId?: Record<string, string>
}

// 3. Класс результирующей схемы, который хранит строгие типы
export class Schema<Def extends SchemaDefinition> {
  // Наш config будет в точности повторять структуру, которую вернул коллбэк
  public config: Def

  constructor(config: Def) {
    this.config = config
  }

  // Пример использования: метод создания компонента автоматически знает точные ключи!
  public component(options: {
    customId: keyof Def['CustomId'] | ((id: string) => boolean)
    resolve: (ctx: {context: Def['Context']; customId: string}) => Promise<any> | any
  }) {
    // Внутренняя логика библиотеки
  }
}

// 4. Главная функция-фабрика createSchemaBuilder
export function createSchemaBuilder<const Def extends SchemaDefinition>(
  cb: (t: TypeHelper) => Def,
): Schema<Def> {
  const helper = new TypeHelper()
  const config = cb(helper)
  return new Schema<Def>(config)
}

interface Context {
  logger?: typeof console.log
}

const schema = createSchemaBuilder((t) => ({
  // Context: t.$type<Context>(),
  CustomId: {
    delete: 'global:delete',
    reply: 'global:reply',
  },
}))

schema.config satisfies {
  Context: Context
  CustomId: {
    delete: 'global:delete'
    reply: 'global:reply'
  }
}

const builder = <T extends boolean>(...args: T extends true ? [val: string] : [val?: string]) => void {}

builder<true>()
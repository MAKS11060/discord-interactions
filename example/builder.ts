import {InteractionBuilder} from '#app'

export const schema = new InteractionBuilder({
  customIds: {
    btn1: 'test1:reply',
    btn2: 'test1:ephemeral',
    btnReply: 'test2:reply',
    btnReplyEphemeral: 'test2:reply-ephemeral',
    btnUpdate: 'test2:update',
    btnDelete: 'btn:delete',
    helloDetail: 'hello:detail',
    helloSecondary: 'hello:secondary',
    helloSelect: 'hello:user-select',
  },
})

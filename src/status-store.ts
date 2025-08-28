export type MsgStatus = 'PROCESSADO_SUCESSO' | 'FALHA_PROCESSAMENTO';

export const messageStatus = new Map<string, {
    status: MsgStatus,
    body: string
}>();
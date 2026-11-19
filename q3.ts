import {
    Exp, Program, VarDecl, isProgram, isBoolExp, isNumExp, isStrExp, isVarRef,
    isDefineExp, isProcExp, isIfExp, AppExp, isPrimOp, isAppExp
} from './L3/L3-ast';
import { Result, makeOk, makeFailure, bind, mapv, mapResult } from './shared/result';
import { map } from 'ramda';

const isInfixOp = (op: string): boolean =>
    ["+", "-", "*", "/", "<", ">", "=", "and", "or"].includes(op);

const primOpToPython = (op: string): string =>
    op === "=" ? "==" :
        op === "number?" ? "(lambda x : (type(x) == int or type(x) == float))" :
            op === "boolean?" ? "(lambda x : (type(x) == bool))" :
                op;

const appToPython = (exp: AppExp): Result<string> =>
    bind(mapResult(l2ToPython, exp.rands), (rands: string[]) =>
        isPrimOp(exp.rator) ?
            (exp.rator.op === "not" ? makeOk(`(not ${rands[0]})`) :
                isInfixOp(exp.rator.op) ? makeOk(`(${rands.join(` ${primOpToPython(exp.rator.op)} `)})`) :
                    makeOk(`${primOpToPython(exp.rator.op)}(${rands.join(",")})`)) :
            mapv(l2ToPython(exp.rator), (rator: string) => `${rator}(${rands.join(",")})`));
/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [Parsed | Error] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string> =>
    isProgram(exp) ? mapv(mapResult(l2ToPython, exp.exps), (exps: string[]) => exps.join("\n")) :
        isBoolExp(exp) ? makeOk(exp.val ? "True" : "False") :
            isNumExp(exp) ? makeOk(exp.val.toString()) :
                isStrExp(exp) ? makeOk(`"${exp.val}"`) :
                    isVarRef(exp) ? makeOk(exp.var) :
                        isDefineExp(exp) ? mapv(l2ToPython(exp.val), (val: string) => `${exp.var.var} = ${val}`) :
                            isProcExp(exp) ? mapv(l2ToPython(exp.body[0]), (body: string) =>
                                `(lambda ${map((p: VarDecl) => p.var, exp.args).join(",")} : ${body})`) :
                                isIfExp(exp) ? bind(l2ToPython(exp.test), (test: string) =>
                                    bind(l2ToPython(exp.then), (then: string) =>
                                        mapv(l2ToPython(exp.alt), (alt: string) => `(${then} if ${test} else ${alt})`))) :
                                    isPrimOp(exp) ? makeOk(primOpToPython(exp.op)) :
                                        isAppExp(exp) ? appToPython(exp) :
                                            makeFailure(`Not an L2 expression: ${exp.tag}`);
import {
    Exp, Program, VarDecl, isProgram, isBoolExp, isNumExp, isStrExp, isVarRef,
    isDefineExp, isProcExp, isIfExp
} from './L3/L3-ast';
import { Result, makeOk, makeFailure, bind, mapv, mapResult } from './shared/result';
import { map } from 'ramda';

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
                                    makeFailure(`Not an L2 expression: ${exp.tag}`);
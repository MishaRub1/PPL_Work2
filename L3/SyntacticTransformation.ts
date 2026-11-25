import {
    ClassExp, ProcExp, Exp, Program, CExp, Binding, makeProcExp, makeVarDecl,
    makeIfExp, makeAppExp, makePrimOp, makeVarRef, makeLitExp, isProcExp,
    isProgram, makeProgram, isDefineExp, makeDefineExp, isAtomicExp, isLitExp,
    isIfExp, isAppExp, isLetExp, makeLetExp, makeBinding, isClassExp
} from "./L3-ast";
import { makeSymbolSExp } from "./L3-value";
import { first, rest, isNonEmptyList } from "../shared/list";
import { Result, makeOk } from "../shared/result";
import { map } from "ramda";

const methodBody = (val: CExp): CExp =>
    isProcExp(val) && val.body.length === 1 ? val.body[0] :
        makeAppExp(val, []);

const methodsToIf = (methods: Binding[]): CExp =>
    isNonEmptyList<Binding>(methods) ?
        makeIfExp(
            makeAppExp(makePrimOp("eq?"), [makeVarRef("msg"), makeLitExp(makeSymbolSExp(first(methods).var.var))]),
            methodBody(first(methods).val),
            methodsToIf(rest(methods))) :
        makeLitExp(makeSymbolSExp("error"));
/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>
    makeProcExp(exp.fields, [makeProcExp([makeVarDecl("msg")], [methodsToIf(exp.methods)])]);


/*
Purpose: Transform all class forms in the given AST to procs
Signature: transform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/

export const transform = (exp: Exp | Program): Result<Exp | Program> =>
    isProgram(exp) ? makeOk(makeProgram(map(transformExp, exp.exps))) :
        makeOk(transformExp(exp));

const transformExp = (exp: Exp): Exp =>
    isDefineExp(exp) ? makeDefineExp(exp.var, transformCExp(exp.val)) :
        transformCExp(exp);

const transformCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
        isLitExp(exp) ? exp :
            isIfExp(exp) ? makeIfExp(transformCExp(exp.test), transformCExp(exp.then), transformCExp(exp.alt)) :
                isAppExp(exp) ? makeAppExp(transformCExp(exp.rator), map(transformCExp, exp.rands)) :
                    isProcExp(exp) ? makeProcExp(exp.args, map(transformCExp, exp.body)) :
                        isLetExp(exp) ? makeLetExp(map((b: Binding) => makeBinding(b.var.var, transformCExp(b.val)), exp.bindings),
                            map(transformCExp, exp.body)) :
                            isClassExp(exp) ? transformCExp(class2proc(exp)) :
                                exp;

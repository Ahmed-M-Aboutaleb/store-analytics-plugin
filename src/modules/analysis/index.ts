import AnalysisModuleService from "./service";
import { Module } from "@medusajs/framework/utils";

export const ANALYSIS_MODULE = "analysis";

export default Module(ANALYSIS_MODULE, {
  service: AnalysisModuleService,
});

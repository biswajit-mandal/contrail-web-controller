/*
 * Copyright (c) 2015 Juniper Networks, Inc. All rights reserved.
 *
 */

define([
    'underscore'
], function (_) {
    var vnCfgFormatters = function() {
        var self = this;

        /*
         * @IPBlockFormatter
         */
        this.IPBlockFormatter = function(d, c, v, cd, dc) {
            var ipamObjs =
                contrail.handleIfNull(dc['network_ipam_refs'], []);

            var len = ipamObjs.length, count = 0, subnetCnt = 0, returnStr = '';

            if (!len) {
               return returnStr;
            }

            for(var i = 0; i < len; i++) {
                var ipam = ipamObjs[i];
                var subnetStr = '', field = 'ipam_subnets';
                var subnetLen = ipam['attr'][field].length;

                subnetCnt += subnetLen;

                if (count > 2 && cd != -1) {
                    continue;
                }

                for(var j = 0; j < subnetLen; j++) {
                    count++;
                    if (count > 2 && cd != -1) {
                        break;
                    }
                    var ip_block = ipam['attr'][field][j];
                    var cidr = ip_block.subnet.ip_prefix + '/' +
                               ip_block.subnet.ip_prefix_len;
                    returnStr += cidr +
                                 '<br>';
                 }
             }

             if (subnetCnt > 2 && cd != -1) {
                 returnStr += '<span class="moredataText">(' + (subnetCnt - 2) +
                              ' more)</span><span class="moredata"' +
                              ' style="display:none;"></span>';
             } 
             return returnStr;
        };

        /*
         * private @getSubnetDNSStatus
         */
        var getSubnetDNSStatus = function(subnetObj) {
            var dhcpOpts = getValueByJsonPath(subnetObj,
                                'dhcp_option_list;dhcp_option', []);
            if (dhcpOpts.length) {
                return getdhcpValuesByOption(dhcpOpts, 6).indexOf("0.0.0.0")
                        == -1 ? true : false;
            }
             return true;
        };

        /*
         * private @getdhcpValueByOption
         */
        var getdhcpValuesByOption = function(dhcpObj, optCode) {
            var dhcpValues = '', dhcpObjLen = dhcpObj.length;

            if (dhcpObjLen == 0 ) {
               return dhcpValues;
            }

            try {
                for (var i = 0; i < dhcpObjLen; i++) {
                    if (parseInt(dhcpObj[i].dhcp_option_name) ==
                        parseInt(optCode)) {
                       dhcpValues += dhcpObj[i].dhcp_option_value + ' '; 
                    }
                }
            } catch (e) {
                console.trace(e);
                return "Error";
            }

             return dhcpValues.trim();
        };

        /*
         * @adminStateFormatter
         */
        this.adminStateFormatter = function(d, c, v, cd, dc) {
            var  adminState =
                getValueByJsonPath(dc, 'id_perms;enable', false);

            return adminState ? 'Up' : 'Down';
        };

        /*
         * @sharedFormatter
         */
        this.sharedFormatter = function(d, c, v, cd, dc) {
            var  sharedState =
                getValueByJsonPath(dc, 'is_shared', false);

            return sharedState ? 'Enabled' : 'Disabled';
        };

        /*
         * @rtrExternalFormatter
         */
        this.rtrExternalFormatter = function(d, c, v, cd, dc) {
            var  rtrExternal =
                getValueByJsonPath(dc, 'router_external', false);

            return rtrExternal ? 'Enabled' : 'Disabled';
        };

        /*
         * @polColFormatter
         */
        this.polColFormatter = function(d, c, v, cd, dc) {
            var domain  = contrail.getCookie(cowc.COOKIE_DOMAIN); 
            var project = contrail.getCookie(cowc.COOKIE_PROJECT); 
            var polStr = '';
            var pols   =
                getValueByJsonPath(dc, 'network_policy_refs', []);

            if (!pols.length) {
                return '-';
            }

            var sortedPols = 
             _.sortBy(pols, function (pol) {
                 var sequence =
                    Number(getValueByJsonPath(pol, 'attr;sequence;major', 0));
                 return ((1 + sequence) * 100000 ) - sequence;
            });

            var pLen = 2;
            if (cd == -1) {
                pLen = pols.length
            }
            $.each(_.first(sortedPols, pLen),
                function (i, obj) {
                    polStr += obj.to[2];
                    if (obj.to[0] != domain ||
                        obj.to[1] != project) {
                        if (obj.to[0] == domain) {
                            polStr += ' (' + obj.to[1] + ')';
                        } else {
                            polStr += ' (' + obj.to[0] +
                                        ':' + obj.to[1] +')';
                        }
                    }
                    polStr += '<br/>';
                }
            );
            if (pols.length > pLen && cd != -1) {
                polStr += (pols.length - pLen) + ' more';
            }

            return polStr;
        };

        /*
         * @polRefFormatter
         */
        this.polRefFormatter = function(d, c, v, cd, dc) {
            var polArr = [];
            var pols   =
                getValueByJsonPath(dc, 'network_policy_refs', []);

            if (!pols.length) {
                return '-';
            }

            var sortedPols = 
             _.sortBy(pols, function (pol) {
                 var sequence =
                    Number(getValueByJsonPath(pol, 'attr;sequence;major', 0));
                 return ((1 + sequence) * 100000 ) - sequence;
            });

            pLen = pols.length;

            $.each(sortedPols,
                function (i, obj) {
                    polArr.push(obj.to.join(':'));
                }
            );

            return polArr;
        };

        /*
         * @fipPoolTmplFormatter
         */
        this.fipPoolTmplFormatter = function(d, c, v, cd, dc) {
            var poolStr = [], poolArr = [];
            var pools   =
                getValueByJsonPath(dc, 'floating_ip_pools', []);

            if (!pools.length) {
                return cd == -1 ? poolArr : '-';
            }

            $.each(pools, function (i, obj) {
                var poolName = getValueByJsonPath(obj, 'to;3', '');
                var disable = poolName == 'default' ? true : false; 
                poolStr.push(poolName);
                poolArr.push({'name': poolName,
                    'projects': [], 'disable': disable});
            });

            return cd == -1 ? poolArr : poolStr.join(', ');
        };

        /*
         * @subnetTmplFormatter
         */
        this.subnetTmplFormatter = function(d, c, v, cd, dc) {
            var ipamObjs =
                contrail.handleIfNull(dc['network_ipam_refs'], []);

            var len = ipamObjs.length, count = 0,
                        subnetCnt = 0, returnStr = '';

            if (!len) {
                if (cd == -1) {
                    return [];
                } else {
                    return '-';
                }
            }

            for(var i = 0; i < len; i++) {
                var ipam = ipamObjs[i];
                var field = 'ipam_subnets';
                var subnetLen = ipam['attr'][field].length;
                var returnArr = [];

                for(var j = 0; j < subnetLen; j++) {
                    var ip_block = ipam['attr'][field][j];
                    var cidr = ip_block.subnet.ip_prefix + '/' +
                               ip_block.subnet.ip_prefix_len;
                    var gw   = ip_block.default_gateway;
                    var dhcp = ip_block.enable_dhcp ? 'Enabled' : 'Disabled'; 
                    var dns  = getSubnetDNSStatus(ip_block) ? 'Enabled' : 'Disabled';
                    var gwStatus =  (gw == null || gw == "" || gw == "0.0.0.0") ?
                                        'Disabled' : gw;

                    var allocPools = [];
                    if ('allocation_pools' in ip_block &&
                                ip_block.allocation_pools.length) {
                        allocPools = ip_block.allocation_pools;
                    }
                    var allocPoolStr = [];
                    allocPools.every(function(pool) {
                        allocPoolStr.push(pool.start + '-' + pool.end);
                        return true;
                    });
                    allocPoolStr.join(",");

                    returnStr += cidr + ', Gateway ' + gwStatus +
                                ', DHCP ' + dhcp + ', DNS ' + dns +
                                (allocPoolStr.length ? ', Allocation Pools: ' +
                                allocPoolStr : '') + '<br/>'
                 }
             }

             return returnStr;
        };

        /*
         * @subnetModelFormatter
         */
        this.subnetModelFormatter = function(d, c, v, cd, dc) {
            var ipamObjs =
                contrail.handleIfNull(dc['network_ipam_refs'], []);

            var len = ipamObjs.length, count = 0,
                        subnetCnt = 0, returnStr = '';

            var returnArr = [];

            if (!len) {
                return returnArr;
            }

            for(var i = 0; i < len; i++) {
                var ipam = ipamObjs[i];
                var ipamFQN = ipamObjs[i].to.join(":");
                var field = 'ipam_subnets';
                var subnetLen = ipam['attr'][field].length;

                for(var j = 0; j < subnetLen; j++) {
                    var subnetObj = {};
                    var ip_block = ipam['attr'][field][j];
                    subnetObj = ip_block;
                    var cidr = ip_block.subnet.ip_prefix + '/' +
                               ip_block.subnet.ip_prefix_len;
                    subnetObj['user_created_cidr'] = cidr;
                    var allocPools = [];
                    
                    if ('allocation_pools' in ip_block &&
                                ip_block.allocation_pools.length) {
                        allocPools = ip_block.allocation_pools;
                    }
                    var allocPoolStr = '';
                    allocPools.every(function(pool) {
                        allocPoolStr += pool.start + "-" + pool.end + "\n";
                        return true;
                    });
                    subnetObj['allocation_pools'] = allocPoolStr.trim();
                    subnetObj['user_created_enable_gateway'] =
                        getValueByJsonPath(ip_block, 'default_gateway', "");
                    subnetObj['user_created_enable_gateway'] =
                        subnetObj['user_created_enable_gateway'].length &&
                        subnetObj['user_created_enable_gateway'].indexOf("0.0.0.0")
                                    == -1 ? true : false;
                    subnetObj['user_created_ipam_fqn'] = ipamFQN;
                    subnetObj['user_created_enable_dns']  = getSubnetDNSStatus(ip_block);
                    subnetObj['disable'] = true;

                    returnArr.push(subnetObj);
                 }
             }

             return returnArr;
        };


        /*
         * @subnetHostRouteFormatter
         */
        this.subnetHostRouteFormatter = function(d, c, v, cd, dc) {
            var ipamObjs =
                contrail.handleIfNull(dc['network_ipam_refs'], []);

            var len = ipamObjs.length, count = 0,
                        subnetCnt = 0, returnArr = [], returnStr = '';

            if (!len) {
               return cd == -1 ? []: '-';
            }

            for (var i = 0; i < len; i++) {
                var ipam = ipamObjs[i];
                var field = 'ipam_subnets';
                var subnetLen = ipam['attr'][field].length;

                for (var j = 0; j < subnetLen; j++) {
                    var ipBlock = ipam['attr'][field][j];
                    var hRoutes = getValueByJsonPath(ipBlock,
                                'host_routes;route', []);
                    if (hRoutes.length) {
                       returnArr.push(hRoutes); 
                    }
                }
            }

            returnArr = _.flatten(returnArr);
            returnArr = _.uniq(returnArr, function(returnArr){
                    return JSON.stringify(returnArr)
            });

            if (cd == -1) {
                return returnArr;
            }

            $.each(returnArr, function (i, obj) {
                returnStr += obj.prefix + ' ' + obj.next_hop + '<br/>';
            });

            return returnStr;
        };

        /*
         * @subnetDNSFormatter
         */
        this.subnetDNSFormatter = function(d, c, v, cd, dc) {
            var ipamObjs =
                contrail.handleIfNull(dc['network_ipam_refs'], []);

            var len = ipamObjs.length, count = 0, returnArr = [];

            if (!len) {
                if (cd != -1 ) {
                   return '-';
                } else {
                    return [];
                }
            }

            for (var i = 0; i < len; i++) {
                var ipam = ipamObjs[i];
                var field = 'ipam_subnets';
                var subnetLen = ipam['attr'][field].length;

                for (var j = 0; j < subnetLen; j++) {
                    var ipBlock = ipam['attr'][field][j];
                    var dhcpOpts = getValueByJsonPath(ipBlock,
                                'dhcp_option_list;dhcp_option', []);
                    if (dhcpOpts.length) {
                        returnArr.push(getdhcpValuesByOption(dhcpOpts, 6).split(' ')); 
                    }
                }
            }

            returnArr = _.flatten(returnArr);
                        returnArr = _.uniq(returnArr, function(returnArr){
                                                return JSON.stringify(returnArr)
                                        });
            if (returnArr.length) {
                returnArr = _.without(returnArr, '0.0.0.0');
                returnArr = _.without(returnArr, '');
            }

            return returnArr.length ?
                (cd == -1 ? [returnArr.join(' ')] : returnArr.join('<br/>')):
                (cd == -1 ? [] : '-');
        };

        /*
         * @routeTargetFormatter
         */
        this.routeTargetFormatter = function(d, c, v, cd, dc) {
            var rtObj =
                contrail.handleIfNull(
                        dc[v]['route_target'], []);
            var rtArr = [];
            var returnStr = '';

            $.each(rtObj, function (i, obj) {
                returnStr += obj.replace('target:','') + '<br/>';
                var rtSplit = obj.split(':');
                if (rtSplit.length == 3) {
                    rtArr.push({'asn': rtSplit[1],
                                'target': rtSplit[2]});
                }
            });

            return cd == -1 ? rtArr: returnStr;
        };

        /*
         * @fwdModeFormatter
         */
        this.fwdModeFormatter = function(d, c, v, cd, dc) {
            var fwdMode = getValueByJsonPath(dc,
                'virtual_network_properties;forwarding_mode', 'l2_l3');

            if (fwdMode == 'l2_l3') {
                return 'L2 and L3';
            } else if (fwdMode == 'l2') {
                return 'L2 only';
            } else if (fwdMode == 'l3') {
                return 'L3 only';
            }
        };

        /*
         * @vxLanIdFormatter
         */
        this.vxLanIdFormatter = function(d, c, v, cd, dc) {
            var vnId = getValueByJsonPath(dc,
                'virtual_network_network_id', 0);
            var vxLanId = getValueByJsonPath(dc,
                'virtual_network_properties;vxlan_network_identifier', 0);
            var vxLanMode = getValueByJsonPath(window.globalObj,
                'global-vrouter-config;global-vrouter-config;vxlan_network_identifier_mode',
                'automatic');

            //Add global mode check to this
            if (vxLanMode == 'configured') {
                if (vxLanId != 0) {
                    return 'Configured (' + vxLanId + ')';
                } else {
                    return 'Not Configured (' + vnId + ')';
                }
            } else {
                return 'Automatic (' + vnId + ')';
            }
        };

        /*
         * @allowTransitFormatter
         */
        this.allowTransitFormatter = function(d, c, v, cd, dc) {
            var allowTransit = getValueByJsonPath(dc,
                'virtual_network_properties;allow_transit', false);

            return allowTransit ? 'Enabled' : 'Disabled'; 
        };

        /*
         * @rpfFormatter
         */
        this.rpfFormatter = function(d, c, v, cd, dc) {
            var rpf = getValueByJsonPath(dc,
                'virtual_network_properties;rpf', 'enable');

            return rpf  == 'enable' ? 'Enabled' : 'Disabled'; 
        };

        /*
         * @floodUnUcastFormatter
         */
        this.floodUnUcastFormatter = function(d, c, v, cd, dc) {
            var uCastEnabled = getValueByJsonPath(dc,
                'flood_unknown_unicast', false);

            return uCastEnabled ? 'Enabled' : 'Disabled'; 
        };

        /*
         * @multiSvcChainFormatter
         */
        this.multiSvcChainFormatter = function(d, c, v, cd, dc) {
            var multiSvcChainEnabled = getValueByJsonPath(dc,
                'multi_policy_service_chains_enabled', false);

            return multiSvcChainEnabled ? 'Enabled' : 'Disabled';
        };

        /*
         * @sriovFormatter
         */
        this.sriovFormatter = function(d, c, v, cd, dc) {
            var segment_id   = getValueByJsonPath(dc,
                                'provider_properties;segmentation_id', null);
            var physical_net = getValueByJsonPath(dc,
                                'provider_properties;physical_network', null);

            if (segment_id != null && physical_net != null) {
                return 'Physical Network: ' + physical_net +
                        ' , VLAN: ' + segment_id;        
            } else {
                return 'Disabled';
            }
        };

        /*
         * @phyRouterFormatter
         */
        this.phyRouterFormatter = function(d, c, v, cd, dc) {
            var phyRouters = getValueByJsonPath(dc,
                    'physical_router_back_refs', []);
            var phyRouterList = [], phyRouterArr = [];

            $.each(phyRouters, function (i, obj) {
                var flatName = '';
                cd == -1 ? flatName = obj.uuid : flatName = obj['to'][1];
                //var flatName = obj['to'][1];
                phyRouterList.push(flatName);
                phyRouterArr.push(flatName);
            });

            return cd == -1 ? phyRouterArr : 
                    phyRouterList.length ?
                        phyRouterList.join('<br/>'): '-';
        };

        /*
         * @staticRouteFormatter
         */
        this.staticRouteFormatter = function(d, c, v, cd, dc) {
            var staticRoutes = getValueByJsonPath(dc,
                    'route_table_refs', []);
            var staticRouteList = [], staticRouteArr = [];

            $.each(staticRoutes, function (i, obj) {
                var flatName = '';
                cd == -1 ? flatName = obj.to.join(':') :
                        flatName = obj['to'][2] + ' (' + obj['to'][1] + ')';
                staticRouteList.push(flatName);
                staticRouteArr.push(flatName);
            });

            return cd == -1 ? staticRouteArr :
                    staticRouteList.length ?
                        staticRouteList.join('<br/>'): '-';
        };
        /*
         * @polMSFormatter
         */
        this.polMSFormatter = function(response) {
            var polResponse = getValueByJsonPath(response,
                    'network-policys', []);
            var polList = [];

            $.each(polResponse, function (i, obj) {
                var flatName = obj.fq_name[0] + ':' +
                    obj.fq_name[1] + ':' + obj.fq_name[2];
                polList.push({id: flatName, text: flatName});
            });

            return polList;
        };

        /*
         * @allProjMSFormatter
         */
        this.allProjMSFormatter = function(response) {
            var projResponse = getValueByJsonPath(response,
                    'projects', []);
            var projList = [];

            $.each(projResponse, function (i, obj) {
                var flatName = obj.fq_name[0] + ':' +
                                obj.fq_name[1];
                projList.push({id: obj.uuid, text: flatName});
            });

            return projList;
        };

        /*
         * @phyRouterMSFormatter
         */
        this.phyRouterMSFormatter = function(response) {
            var phyRouterResponse = getValueByJsonPath(response,
                    'physical-routers', []);
            var phyRouterList = [];

            $.each(phyRouterResponse, function (i, obj) {
                var flatName = obj.fq_name;
                phyRouterList.push({id: obj.uuid, text: flatName[1]});
            });

            return phyRouterList;
        };

        /*
         * @staticRouteMSFormatter
         */
        this.staticRouteMSFormatter = function(response) {
            var staticRouteResponse = getValueByJsonPath(response,
                    '0;route-tables', []);
            var staticRouteList = [];

            $.each(staticRouteResponse, function (i, obj) {
                var flatName = obj.fq_name;
                staticRouteList.push({id: obj.fq_name.join(':'),
                                text: flatName[2]+ ' (' + flatName[1] + ')'});
            });

            return staticRouteList;
        };

        /*
         * @ipamDropDownFormatter
         */
        this.ipamDropDownFormatter = function(response) {
            var ipamResponse = getValueByJsonPath(response,
                    'network-ipams', []);
            var ipamList = [];
            var domain  = contrail.getCookie(cowc.COOKIE_DOMAIN);
            var project = contrail.getCookie(cowc.COOKIE_PROJECT);
            var vCenter = isVCenter();

            $.each(ipamResponse, function (i, obj) {
                var flatName = obj.fq_name[2];

                if (domain != obj.fq_name[0] ||
                    project != obj.fq_name[1]) {
                        flatName += ' (' + obj.fq_name[0] +
                                    ':' + obj.fq_name[1] + ')';
                }
                if (vCenter) {
                    if (domain == obj.fq_name[0] &&
                        project == obj.fq_name[1]) {
                        ipamList.push({id: obj.fq_name.join(':'), text: flatName});
                    }
                } else {
                    ipamList.push({id: obj.fq_name.join(':'), text: flatName});
                }
            });

            return ipamList;
        };
    }
    return vnCfgFormatters;
});
